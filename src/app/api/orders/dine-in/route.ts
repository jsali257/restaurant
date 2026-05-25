import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const TAX_RATE = 0.0825;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      restaurant_id,
      table_number,
      customer_name,
      customer_email,
      customer_phone,
      items,
      tip_amount,
      special_instructions,
    } = body;

    if (!restaurant_id || !table_number || !items?.length) {
      return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Validate + price items from DB
    const itemIds = items.map((i: { menu_item_id: string }) => i.menu_item_id);
    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id, name, price, is_active")
      .in("id", itemIds)
      .eq("is_active", true);

    if (menuError || !menuItems?.length) {
      return NextResponse.json({ error: "Some items are unavailable" }, { status: 400 });
    }

    const itemMap = new Map(menuItems.map((i) => [i.id, i]));

    // Compute subtotal using DB prices
    let subtotal = 0;
    for (const item of items) {
      const dbItem = itemMap.get(item.menu_item_id);
      if (!dbItem) {
        return NextResponse.json(
          { error: `Item ${item.menu_item_id} not found or unavailable` },
          { status: 400 }
        );
      }
      const modifierTotal = (item.modifiers ?? []).reduce(
        (s: number, m: { price_delta: number }) => s + m.price_delta,
        0
      );
      subtotal += (dbItem.price + modifierTotal) * item.quantity;
    }
    subtotal = parseFloat(subtotal.toFixed(2));

    const taxAmount = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const tip = parseFloat((tip_amount ?? 0).toFixed(2));
    const total = parseFloat((subtotal + taxAmount + tip).toFixed(2));

    // Create order — dine-in goes straight to confirmed (kitchen sees it immediately)
    const { data: createdOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        restaurant_id,
        order_type: "dine_in",
        table_number,
        customer_name: customer_name || `Table ${table_number}`,
        customer_email: customer_email || "",
        customer_phone: customer_phone ?? null,
        subtotal,
        tax_amount: taxAmount,
        delivery_fee: 0,
        tip_amount: tip,
        discount_amount: 0,
        total,
        coupon_id: null,
        coupon_code: null,
        special_instructions: special_instructions ?? null,
        payment_status: "pending",
        status: "confirmed",
      })
      .select()
      .single();

    if (orderError || !createdOrder) {
      console.error("Dine-in order creation error:", orderError);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Create order items
    const orderItems = items.map((item: {
      menu_item_id: string;
      quantity: number;
      special_instructions?: string;
      modifiers?: { price_delta: number }[];
    }) => {
      const dbItem = itemMap.get(item.menu_item_id)!;
      const modifierTotal = (item.modifiers ?? []).reduce(
        (s: number, m: { price_delta: number }) => s + m.price_delta,
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

    // Insert modifiers
    if (createdItems) {
      const modifierInserts: {
        order_item_id: string;
        modifier_id: string;
        name: string;
        price_delta: number;
      }[] = [];
      for (let i = 0; i < items.length; i++) {
        const orderItem = items[i];
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

    return NextResponse.json({
      order_id: createdOrder.id,
      order_number: createdOrder.order_number,
    });
  } catch (error) {
    console.error("Dine-in order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
