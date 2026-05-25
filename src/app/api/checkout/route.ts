import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getStripe, formatAmountForStripe } from "@/lib/stripe";
import { CreateOrderPayload } from "@/types";

const TAX_RATE = 0.0825;
const DELIVERY_FEE = 3.99;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order }: { order: CreateOrderPayload } = body;

    if (!order?.restaurant_id || !order?.items?.length) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Validate + price items from DB
    const itemIds = order.items.map((i) => i.menu_item_id);
    console.log("[checkout] querying item IDs:", itemIds);

    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id, name, price, is_active")
      .in("id", itemIds)
      .eq("is_active", true);

    console.log("[checkout] menuItems:", menuItems, "error:", menuError?.message);

    if (menuError || !menuItems?.length) {
      return NextResponse.json({ error: "Some items are unavailable" }, { status: 400 });
    }

    const itemMap = new Map(menuItems.map((i) => [i.id, i]));

    // Compute subtotal using DB prices
    let subtotal = 0;
    for (const item of order.items) {
      const dbItem = itemMap.get(item.menu_item_id);
      if (!dbItem) {
        return NextResponse.json(
          { error: `Item ${item.menu_item_id} not found or unavailable` },
          { status: 400 }
        );
      }
      const modifierTotal = (item.modifiers ?? []).reduce(
        (s, m) => s + m.price_delta,
        0
      );
      subtotal += (dbItem.price + modifierTotal) * item.quantity;
    }
    subtotal = parseFloat(subtotal.toFixed(2));

    // Validate coupon
    let discountAmount = 0;
    let couponId: string | undefined;
    if (order.coupon_code) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("restaurant_id", order.restaurant_id)
        .eq("code", order.coupon_code.toUpperCase())
        .eq("is_active", true)
        .single();

      if (coupon && subtotal >= coupon.min_order_amount) {
        couponId = coupon.id;
        discountAmount =
          coupon.discount_type === "percentage"
            ? parseFloat(((subtotal * coupon.discount_value) / 100).toFixed(2))
            : Math.min(coupon.discount_value, subtotal);
      }
    }

    const deliveryFee = order.order_type === "delivery" ? DELIVERY_FEE : 0;
    const taxAmount = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const tipAmount = parseFloat((order.tip_amount ?? 0).toFixed(2));
    const total = parseFloat(
      (subtotal + taxAmount + deliveryFee + tipAmount - discountAmount).toFixed(2)
    );

    // Create order in DB
    const { data: createdOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        restaurant_id: order.restaurant_id,
        order_type: order.order_type,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone ?? null,
        delivery_address: order.delivery_address ?? null,
        delivery_city: order.delivery_city ?? null,
        delivery_state: order.delivery_state ?? null,
        delivery_zip: order.delivery_zip ?? null,
        delivery_instructions: order.delivery_instructions ?? null,
        subtotal,
        tax_amount: taxAmount,
        delivery_fee: deliveryFee,
        tip_amount: tipAmount,
        discount_amount: discountAmount,
        total,
        coupon_id: couponId ?? null,
        coupon_code: order.coupon_code ?? null,
        special_instructions: order.special_instructions ?? null,
        payment_status: "pending",
        status: "pending",
      })
      .select()
      .single();

    if (orderError || !createdOrder) {
      console.error("Order creation error:", orderError);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Create order items
    const orderItems = order.items.map((item) => {
      const dbItem = itemMap.get(item.menu_item_id)!;
      const modifierTotal = (item.modifiers ?? []).reduce(
        (s, m) => s + m.price_delta,
        0
      );
      return {
        order_id: createdOrder.id,
        menu_item_id: item.menu_item_id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: item.quantity,
        special_instructions: item.special_instructions ?? null,
        subtotal: parseFloat(((dbItem.price + modifierTotal) * item.quantity).toFixed(2)),
      };
    });

    const { data: createdItems } = await supabase
      .from("order_items")
      .insert(orderItems)
      .select();

    // Insert modifiers for each item
    if (createdItems) {
      const modifierInserts = [];
      for (let i = 0; i < order.items.length; i++) {
        const orderItem = order.items[i];
        const dbOrderItem = createdItems[i];
        if (!dbOrderItem) continue;
        for (const mod of orderItem.modifiers ?? []) {
          modifierInserts.push({
            order_item_id: dbOrderItem.id,
            modifier_id: mod.modifier_id,
            name: mod.name,
            price_delta: mod.price_delta,
          });
        }
      }
      if (modifierInserts.length) {
        await supabase.from("order_item_modifiers").insert(modifierInserts);
      }
    }

    // Create Stripe checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: order.customer_email,
      line_items: [
        ...order.items.map((item) => {
          const dbItem = itemMap.get(item.menu_item_id)!;
          const modifierTotal = (item.modifiers ?? []).reduce((s, m) => s + m.price_delta, 0);
          return {
            price_data: {
              currency: "usd",
              product_data: {
                name: dbItem.name,
                description: item.modifiers?.map((m) => m.name).join(", ") || undefined,
              },
              unit_amount: formatAmountForStripe(dbItem.price + modifierTotal),
            },
            quantity: item.quantity,
          };
        }),
        ...(taxAmount > 0
          ? [
              {
                price_data: {
                  currency: "usd",
                  product_data: { name: "Sales Tax (8.25%)" },
                  unit_amount: formatAmountForStripe(taxAmount),
                },
                quantity: 1,
              },
            ]
          : []),
        ...(deliveryFee > 0
          ? [
              {
                price_data: {
                  currency: "usd",
                  product_data: { name: "Delivery Fee" },
                  unit_amount: formatAmountForStripe(deliveryFee),
                },
                quantity: 1,
              },
            ]
          : []),
        ...(tipAmount > 0
          ? [
              {
                price_data: {
                  currency: "usd",
                  product_data: { name: "Tip" },
                  unit_amount: formatAmountForStripe(tipAmount),
                },
                quantity: 1,
              },
            ]
          : []),
        ...(discountAmount > 0
          ? [
              {
                price_data: {
                  currency: "usd",
                  product_data: { name: `Discount (${order.coupon_code})` },
                  unit_amount: -formatAmountForStripe(discountAmount),
                },
                quantity: 1,
              },
            ]
          : []),
      ],
      metadata: {
        order_id: createdOrder.id,
        order_number: createdOrder.order_number,
      },
      success_url: `${appUrl}/order/success?order_id=${createdOrder.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    // Save session id to order
    await supabase
      .from("orders")
      .update({ stripe_payment_intent_id: session.payment_intent as string })
      .eq("id", createdOrder.id);

    return NextResponse.json({
      url: session.url,
      order_id: createdOrder.id,
      session_id: session.id,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
