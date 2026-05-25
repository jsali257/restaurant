import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin — Ember & Oak",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-stone-950">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-stone-50 dark:bg-stone-900">
        {children}
      </main>
    </div>
  );
}
