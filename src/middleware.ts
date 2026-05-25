import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const isLoginPage = pathname === "/admin/login";
  const isStaffRoute = pathname.startsWith("/staff");

  // Not logged in — protect admin and staff routes
  if (!user) {
    if (isAdminRoute || isStaffRoute) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return response;
  }

  // Logged in — check role once for both branches
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = !!profile && ["admin", "owner", "staff"].includes(profile.role);

  // Has no admin role — block admin and staff routes
  if ((isAdminRoute || isStaffRoute) && !isAdmin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Has admin role — skip the login page
  if (isLoginPage && isAdmin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/staff", "/staff/:path*"],
};
