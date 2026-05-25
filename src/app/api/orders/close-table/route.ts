import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { restaurant_id, table_number } = await req.json();

    if (!restaurant_id || !table_number) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find all open dine-in orders for this table
    const { data: orders, error: fetchError } = await supabase
      .from("orders")
      .select("id, total")
      .eq("restaurant_id", restaurant_id)
      .eq("order_type", "dine_in")
      .eq("table_number", table_number)
      .eq("payment_status", "pending")
      .not("status", "in", '("cancelled","refunded")');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!orders?.length) {
      return NextResponse.json({ error: "No open orders found for this table" }, { status: 404 });
    }

    const orderIds = orders.map((o) => o.id);
    const combinedTotal = parseFloat(
      orders.reduce((s, o) => s + o.total, 0).toFixed(2)
    );

    // Mark all orders as paid and completed
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        status: "delivered",
        completed_at: new Date().toISOString(),
      })
      .in("id", orderIds);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      closed_orders: orderIds.length,
      total_charged: combinedTotal,
    });
  } catch (error) {
    console.error("Close table error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
