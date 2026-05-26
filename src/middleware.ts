import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const ADMIN_ROLES = ["admin", "owner"];
const STAFF_ROLES = ["admin", "owner", "staff"];
const KITCHEN_ROLES = ["admin", "owner", "staff", "kitchen"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  const isAdminRoute = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isStaffRoute = pathname.startsWith("/staff");
  const isKitchenRoute = pathname === "/kitchen";
  const isLoginPage = pathname === "/admin/login";

  if (!user) {
    if (isAdminRoute || isStaffRoute || isKitchenRoute) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "customer";

  // Redirect logged-in users away from the login page to their portal
  if (isLoginPage) {
    if (ADMIN_ROLES.includes(role)) return NextResponse.redirect(new URL("/admin", request.url));
    if (role === "staff") return NextResponse.redirect(new URL("/staff", request.url));
    if (role === "kitchen") return NextResponse.redirect(new URL("/kitchen", request.url));
    return response;
  }

  // Admin routes: only admin/owner
  if (isAdminRoute && !ADMIN_ROLES.includes(role)) {
    if (role === "staff") return NextResponse.redirect(new URL("/staff", request.url));
    if (role === "kitchen") return NextResponse.redirect(new URL("/kitchen", request.url));
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Staff routes: admin, owner, staff
  if (isStaffRoute && !STAFF_ROLES.includes(role)) {
    if (role === "kitchen") return NextResponse.redirect(new URL("/kitchen", request.url));
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Kitchen: all internal roles
  if (isKitchenRoute && !KITCHEN_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/staff", "/staff/:path*", "/kitchen"],
};
