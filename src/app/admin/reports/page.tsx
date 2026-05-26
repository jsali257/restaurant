"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Banknote,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, RESTAURANT_ID } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface ReportOrder {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  order_type: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  tip_amount: number;
  discount_amount: number;
  total: number;
  payment_status: string;
  payment_method: string | null;
  order_items: { name: string; quantity: number; subtotal: number }[];
}

type Preset = "today" | "yesterday" | "week" | "last_week" | "month" | "custom";

function getRange(preset: Preset, customStart: string, customEnd: string): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  switch (preset) {
    case "today":
      return { start: today, end: tomorrow };
    case "yesterday": {
      const y = new Date(today); y.setDate(y.getDate() - 1);
      return { start: y, end: today };
    }
    case "week": {
      const w = new Date(today); w.setDate(w.getDate() - 7);
      return { start: w, end: tomorrow };
    }
    case "last_week": {
      const lw2 = new Date(today); lw2.setDate(lw2.getDate() - 7);
      const lw1 = new Date(today); lw1.setDate(lw1.getDate() - 14);
      return { start: lw1, end: lw2 };
    }
    case "month": {
      const m = new Date(today); m.setDate(m.getDate() - 30);
      return { start: m, end: tomorrow };
    }
    case "custom":
      return {
        start: customStart ? new Date(customStart) : today,
        end: customEnd ? new Date(new Date(customEnd).setHours(23, 59, 59, 999)) : tomorrow,
      };
  }
}

function exportCSV(orders: ReportOrder[], label: string) {
  const header = [
    "Order #", "Date", "Time", "Customer", "Email",
    "Type", "Status", "Items",
    "Subtotal", "Tax", "Tips", "Discount", "Total",
    "Payment Status", "Payment Method",
  ];

  const rows = orders.map((o) => [
    o.order_number,
    new Date(o.created_at).toLocaleDateString(),
    new Date(o.created_at).toLocaleTimeString(),
    o.customer_name,
    o.customer_email,
    o.order_type.replace("_", " "),
    o.status,
    o.order_items.reduce((s, i) => s + i.quantity, 0),
    o.subtotal.toFixed(2),
    o.tax_amount.toFixed(2),
    (o.tip_amount || 0).toFixed(2),
    (o.discount_amount || 0).toFixed(2),
    o.total.toFixed(2),
    o.payment_status,
    o.payment_method || "stripe",
  ]);

  const csv = [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ember-oak-${label}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "Last 7 Days" },
  { key: "last_week", label: "Prev 7 Days" },
  { key: "month", label: "Last 30 Days" },
  { key: "custom", label: "Custom" },
];

export default function AdminReportsPage() {
  const [preset, setPreset] = useState<Preset>("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { start, end } = getRange(preset, customStart, customEnd);
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(name, quantity, subtotal)")
      .eq("restaurant_id", RESTAURANT_ID)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: false });
    setOrders((data as ReportOrder[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [preset, customStart, customEnd]);

  const paid = orders.filter((o) => o.payment_status === "paid");
  const totalRevenue = paid.reduce((s, o) => s + o.total, 0);
  const totalTax = paid.reduce((s, o) => s + o.tax_amount, 0);
  const totalTips = paid.reduce((s, o) => s + (o.tip_amount || 0), 0);
  const avgOrder = paid.length ? totalRevenue / paid.length : 0;

  const byType = {
    dine_in: paid.filter((o) => o.order_type === "dine_in").length,
    pickup: paid.filter((o) => o.order_type === "pickup").length,
    delivery: paid.filter((o) => o.order_type === "delivery").length,
  };
  const byPayment = {
    card: paid.filter((o) => !o.payment_method || o.payment_method === "card" || o.payment_method === "stripe").length,
    cash: paid.filter((o) => o.payment_method === "cash").length,
  };

  const { start, end } = getRange(preset, customStart, customEnd);
  const rangeLabel = `${start.toLocaleDateString()}-${new Date(end.getTime() - 1).toLocaleDateString()}`;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white">Shift Reports</h1>
          <p className="text-stone-400 text-sm mt-1">{orders.length} orders in range · {paid.length} paid</p>
        </div>
        <Button
          onClick={() => exportCSV(orders, preset)}
          className="gap-2"
          disabled={orders.length === 0}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Date range selector */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-4 mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                preset === p.key
                  ? "bg-orange-500 text-white"
                  : "bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <div className="flex gap-3 mt-3">
            <div>
              <label className="text-xs text-stone-500 mb-1 block">From</label>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="input-base text-sm" />
            </div>
            <div>
              <label className="text-xs text-stone-500 mb-1 block">To</label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="input-base text-sm" />
            </div>
          </div>
        )}
        {preset !== "custom" && (
          <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-1">
            <Calendar className="w-3 h-3" />
            {rangeLabel}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-7 h-7 text-orange-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Revenue", value: formatCurrency(totalRevenue), sub: `${paid.length} paid orders`, icon: DollarSign, color: "bg-emerald-500" },
              { label: "Avg Order", value: formatCurrency(avgOrder), sub: "per paid order", icon: TrendingUp, color: "bg-orange-500" },
              { label: "Tax Collected", value: formatCurrency(totalTax), sub: "8.25% rate", icon: ShoppingBag, color: "bg-blue-500" },
              { label: "Tips", value: formatCurrency(totalTips), sub: "total gratuity", icon: DollarSign, color: "bg-purple-500" },
            ].map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-stone-800 rounded-2xl p-5 border border-stone-100 dark:border-stone-700"
              >
                <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-black text-stone-900 dark:text-white">{s.value}</p>
                <p className="text-sm text-stone-500 mt-0.5">{s.label}</p>
                <p className="text-xs text-stone-400 mt-0.5">{s.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* By order type */}
            <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-5">
              <h3 className="font-bold text-stone-900 dark:text-white mb-4">Orders by Type</h3>
              <div className="space-y-3">
                {[
                  { key: "dine_in", label: "Dine In", color: "bg-emerald-500" },
                  { key: "pickup", label: "Pickup", color: "bg-orange-500" },
                  { key: "delivery", label: "Delivery", color: "bg-blue-500" },
                ].map(({ key, label, color }) => {
                  const count = byType[key as keyof typeof byType];
                  const pct = paid.length ? Math.round((count / paid.length) * 100) : 0;
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-stone-700 dark:text-stone-300">{label}</span>
                        <span className="text-stone-500">{count} orders ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By payment method */}
            <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-5">
              <h3 className="font-bold text-stone-900 dark:text-white mb-4">Payment Method</h3>
              <div className="space-y-3">
                {[
                  { key: "card", label: "Card / Online", icon: CreditCard, color: "bg-blue-500" },
                  { key: "cash", label: "Cash", icon: Banknote, color: "bg-emerald-500" },
                ].map(({ key, label, icon: Icon, color }) => {
                  const count = byPayment[key as keyof typeof byPayment];
                  const pct = paid.length ? Math.round((count / paid.length) * 100) : 0;
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5" />{label}
                        </span>
                        <span className="text-stone-500">{count} orders ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Orders table */}
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-700 flex items-center justify-between">
              <h3 className="font-bold text-stone-900 dark:text-white">All Orders</h3>
              <span className="text-sm text-stone-400">{orders.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-850">
                    {["Order #", "Date", "Customer", "Type", "Items", "Total", "Payment", "Method"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-700">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-stone-400">No orders in this period</td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-medium text-stone-700 dark:text-stone-300 whitespace-nowrap">
                          {order.order_number}
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-500 whitespace-nowrap">
                          {new Date(order.created_at).toLocaleDateString()}{" "}
                          <span className="text-stone-400">{new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-stone-800 dark:text-white font-medium text-xs">{order.customer_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-stone-500 capitalize">{order.order_type.replace("_", " ")}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-500">
                          {order.order_items?.reduce((s, i) => s + i.quantity, 0) ?? 0}
                        </td>
                        <td className="px-4 py-3 font-bold text-stone-900 dark:text-white text-xs whitespace-nowrap">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            order.payment_status === "paid"
                              ? "bg-green-100 text-green-700"
                              : order.payment_status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-600"
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-400 capitalize">
                          {order.payment_method || "stripe"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
