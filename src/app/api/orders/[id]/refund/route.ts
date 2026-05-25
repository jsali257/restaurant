import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("stripe_charge_id, total, payment_status, status")
    .eq("id", id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.payment_status !== "paid") {
    return NextResponse.json({ error: "Order is not paid" }, { status: 400 });
  }

  if (!order.stripe_charge_id) {
    return NextResponse.json({ error: "No Stripe charge found" }, { status: 400 });
  }

  try {
    await stripe.refunds.create({
      payment_intent: order.stripe_charge_id,
      reason: "requested_by_customer",
    });

    await supabase
      .from("orders")
      .update({ payment_status: "refunded", status: "refunded" })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Refund error:", err);
    return NextResponse.json({ error: "Refund failed" }, { status: 500 });
  }
}
