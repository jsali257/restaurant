import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;

    if (orderId) {
      await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          status: "confirmed",
          stripe_charge_id: session.payment_intent as string,
          accepted_at: new Date().toISOString(),
          estimated_ready_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        })
        .eq("id", orderId);

      // Increment coupon usage if applicable
      const { data: order } = await supabase
        .from("orders")
        .select("coupon_id")
        .eq("id", orderId)
        .single();

      if (order?.coupon_id) {
        await supabase.rpc("increment_coupon_usage", {
          coupon_id: order.coupon_id,
        });
      }
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    if (orderId) {
      await supabase
        .from("orders")
        .update({ status: "cancelled", payment_status: "failed" })
        .eq("id", orderId)
        .eq("payment_status", "pending");
    }
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as Stripe.Charge;
    await supabase
      .from("orders")
      .update({
        payment_status:
          charge.amount_refunded === charge.amount ? "refunded" : "partially_refunded",
        status: "refunded",
      })
      .eq("stripe_charge_id", charge.id);
  }

  return NextResponse.json({ received: true });
}
