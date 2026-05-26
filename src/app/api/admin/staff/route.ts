import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET — list all non-customer profiles
export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .neq("role", "customer")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST — invite a new staff member (or promote an existing user)
export async function POST(req: NextRequest) {
  try {
    const { email, role, full_name } = await req.json();
    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const normalizedEmail = email.toLowerCase().trim();

    // Check auth.users directly — catches users who signed up but have no/mismatched profile row
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    console.log("[staff invite] listUsers error:", listError);
    console.log("[staff invite] total users found:", listData?.users?.length);

    const existingAuthUser = listData?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
    console.log("[staff invite] existingAuthUser:", existingAuthUser?.id ?? "none");

    if (existingAuthUser) {
      // Already registered — just upsert the profile with the new role
      await supabase.from("profiles").upsert({
        id: existingAuthUser.id,
        email: normalizedEmail,
        full_name: full_name || existingAuthUser.user_metadata?.full_name || null,
        role,
      }, { onConflict: "id" });
      return NextResponse.json({ success: true, existing: true });
    }

    // Truly new user — send invite email
    console.log("[staff invite] sending invite to:", normalizedEmail);
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const { data: authData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        data: { full_name: full_name || "" },
        redirectTo: `${siteUrl}/auth/callback?next=/admin`,
      }
    );
    console.log("[staff invite] inviteError:", inviteError);
    console.log("[staff invite] authData user:", authData?.user?.id ?? "none");

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    // Trigger creates profile with role='customer'; override it
    if (authData.user) {
      await supabase.from("profiles").upsert({
        id: authData.user.id,
        email: normalizedEmail,
        full_name: full_name || null,
        role,
      }, { onConflict: "id" });
    }

    return NextResponse.json({ success: true, existing: false });
  } catch (err) {
    console.log("[staff invite] caught exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH — update a staff member's role
export async function PATCH(req: NextRequest) {
  try {
    const { id, role } = await req.json();
    if (!id || !role) {
      return NextResponse.json({ error: "ID and role are required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
