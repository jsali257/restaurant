"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-stone-950">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-stone-50 dark:bg-stone-900">
        {children}
      </main>
    </div>
  );
}
