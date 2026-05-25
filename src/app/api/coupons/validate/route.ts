import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { code, restaurant_id, subtotal } = await req.json();

  if (!code || !restaurant_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("restaurant_id", restaurant_id)
    .eq("code", code.toUpperCase().trim())
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Invalid or expired coupon" }, { status: 404 });
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
  }

  if (data.max_uses && data.uses_count >= data.max_uses) {
    return NextResponse.json({ error: "Coupon has reached usage limit" }, { status: 400 });
  }

  if (subtotal !== undefined && data.min_order_amount > subtotal) {
    return NextResponse.json(
      { error: `Minimum order of $${data.min_order_amount} required` },
      { status: 400 }
    );
  }

  return NextResponse.json({ coupon: data });
}
