"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Tag,
  Settings,
  BarChart3,
  Flame,
  LogOut,
  ChefHat,
  ExternalLink,
  QrCode,
  Users,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin",           icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/orders",    icon: ShoppingBag,     label: "Orders" },
  { href: "/admin/menu",      icon: UtensilsCrossed, label: "Menu" },
  { href: "/admin/tables",    icon: QrCode,          label: "Tables & QR" },
  { href: "/admin/coupons",   icon: Tag,             label: "Coupons" },
  { href: "/admin/analytics", icon: BarChart3,       label: "Analytics" },
  { href: "/admin/reports",   icon: FileText,        label: "Reports" },
  { href: "/admin/staff",     icon: Users,           label: "Staff" },
  { href: "/admin/settings",  icon: Settings,        label: "Settings" },
];

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  staff: "Server",
  kitchen: "Kitchen",
  customer: "Customer",
};

const ROLE_COLORS: Record<string, string> = {
  owner:   "bg-purple-500/20 text-purple-400",
  admin:   "bg-orange-500/20 text-orange-400",
  staff:   "bg-blue-500/20 text-blue-400",
  kitchen: "bg-amber-500/20 text-amber-400",
};

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<{ email: string; full_name: string | null; role: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("email, full_name, role")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);
    }
    loadProfile();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <aside className="flex flex-col w-64 bg-stone-950 border-r border-stone-800 min-h-screen">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Ember & Oak</p>
            <p className="text-stone-500 text-xs">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-gradient-to-r from-orange-500/20 to-red-500/10 text-orange-400 border border-orange-500/20"
                  : "text-stone-400 hover:text-white hover:bg-stone-800"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive && "text-orange-400")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="px-3 py-4 border-t border-stone-800 space-y-0.5">
        <Link
          href="/kitchen"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        >
          <ChefHat className="w-4 h-4" />
          Kitchen Display
          <ExternalLink className="w-3 h-3 ml-auto" />
        </Link>
        <Link
          href="/staff"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        >
          <UtensilsCrossed className="w-4 h-4" />
          Staff Order Entry
          <ExternalLink className="w-3 h-3 ml-auto" />
        </Link>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View Site
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>

        {/* Current user */}
        {profile && (
          <div className="mt-2 px-3 py-3 rounded-xl bg-stone-900 border border-stone-800">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
              <p className="text-white text-xs font-semibold truncate">
                {profile.full_name || profile.email}
              </p>
            </div>
            <span className={cn(
              "inline-block text-xs font-semibold px-2 py-0.5 rounded-full",
              ROLE_COLORS[profile.role] ?? "bg-stone-700 text-stone-400"
            )}>
              {ROLE_LABELS[profile.role] ?? profile.role}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
