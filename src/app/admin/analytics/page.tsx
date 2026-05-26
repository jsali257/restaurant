"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, TrendingUp, ShoppingBag, DollarSign, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, RESTAURANT_ID } from "@/lib/utils";

interface DayData {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

interface ItemData {
  name: string;
  qty: number;
  revenue: number;
}

interface HourData {
  hour: number;
  orders: number;
}

interface Analytics {
  days: DayData[];
  byType: { pickup: number; delivery: number; dine_in: number };
  topItems: ItemData[];
  peakHours: HourData[];
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  uniqueCustomers: number;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<14 | 30>(14);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const since = new Date();
      since.setDate(since.getDate() - range);
      since.setHours(0, 0, 0, 0);

      const { data: orders } = await supabase
        .from("orders")
        .select("id, created_at, total, order_type, customer_email, order_items(name, quantity, subtotal)")
        .eq("restaurant_id", RESTAURANT_ID)
        .eq("payment_status", "paid")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });

      if (!orders) { setLoading(false); return; }

      // Revenue by day
      const dayMap = new Map<string, DayData>();
      for (let i = range - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        dayMap.set(key, { date: key, label, revenue: 0, orders: 0 });
      }
      orders.forEach((o) => {
        const key = o.created_at.slice(0, 10);
        const day = dayMap.get(key);
        if (day) { day.revenue += o.total; day.orders += 1; }
      });

      // By type
      const byType = { pickup: 0, delivery: 0, dine_in: 0 };
      orders.forEach((o) => {
        const t = o.order_type as keyof typeof byType;
        if (t in byType) byType[t]++;
      });

      // Top items
      const itemMap = new Map<string, ItemData>();
      orders.forEach((o) => {
        (o.order_items as { name: string; quantity: number; subtotal: number }[])?.forEach((item) => {
          const existing = itemMap.get(item.name);
          if (existing) {
            existing.qty += item.quantity;
            existing.revenue += item.subtotal;
          } else {
            itemMap.set(item.name, { name: item.name, qty: item.quantity, revenue: item.subtotal });
          }
        });
      });
      const topItems = Array.from(itemMap.values())
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10);

      // Peak hours
      const hourMap = new Map<number, HourData>();
      for (let h = 0; h < 24; h++) hourMap.set(h, { hour: h, orders: 0 });
      orders.forEach((o) => {
        const h = new Date(o.created_at).getHours();
        const slot = hourMap.get(h);
        if (slot) slot.orders += 1;
      });
      const peakHours = Array.from(hourMap.values()).filter((h) => h.orders > 0);

      const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
      const uniqueCustomers = new Set(orders.map((o) => o.customer_email)).size;

      setData({
        days: Array.from(dayMap.values()),
        byType,
        topItems,
        peakHours: Array.from(hourMap.values()),
        totalRevenue,
        totalOrders: orders.length,
        avgOrderValue: orders.length ? totalRevenue / orders.length : 0,
        uniqueCustomers,
      });
      setLoading(false);
    }
    load();
  }, [range]);

  const maxRevenue = data ? Math.max(...data.days.map((d) => d.revenue), 1) : 1;
  const maxItems = data ? Math.max(...data.topItems.map((i) => i.qty), 1) : 1;
  const maxHour = data ? Math.max(...data.peakHours.map((h) => h.orders), 1) : 1;
  const totalByType = data ? data.byType.pickup + data.byType.delivery + data.byType.dine_in : 1;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white">Analytics</h1>
          <p className="text-stone-400 text-sm mt-1">Paid orders only</p>
        </div>
        <div className="flex gap-2">
          {([14, 30] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                range === r
                  ? "bg-orange-500 text-white"
                  : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-orange-300"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
        </div>
      ) : !data ? null : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Revenue", value: formatCurrency(data.totalRevenue), icon: DollarSign, color: "bg-gradient-to-br from-green-400 to-emerald-600" },
              { label: "Total Orders", value: String(data.totalOrders), icon: ShoppingBag, color: "bg-gradient-to-br from-orange-400 to-red-500" },
              { label: "Avg Order Value", value: formatCurrency(data.avgOrderValue), icon: TrendingUp, color: "bg-gradient-to-br from-blue-400 to-indigo-600" },
              { label: "Unique Customers", value: String(data.uniqueCustomers), icon: Users, color: "bg-gradient-to-br from-purple-400 to-violet-600" },
            ].map(({ label, value, icon: Icon, color }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-stone-800 rounded-2xl p-5 border border-stone-100 dark:border-stone-700"
              >
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-black text-stone-900 dark:text-white">{value}</p>
                <p className="text-xs text-stone-400 mt-0.5">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Revenue bar chart */}
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6">
            <h2 className="font-bold text-stone-900 dark:text-white mb-6">Daily Revenue</h2>
            <div className="flex items-end gap-1 h-48 overflow-x-auto">
              {data.days.map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-1 flex-1 min-w-[24px] group">
                  <div className="relative w-full flex items-end" style={{ height: "160px" }}>
                    <div
                      className="w-full bg-orange-500 rounded-t-lg transition-all group-hover:bg-orange-400"
                      style={{ height: `${Math.max((day.revenue / maxRevenue) * 160, day.revenue > 0 ? 4 : 0)}px` }}
                    />
                    {day.revenue > 0 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap pointer-events-none z-10">
                        {formatCurrency(day.revenue)} · {day.orders} orders
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-stone-400 rotate-45 origin-left whitespace-nowrap" style={{ marginLeft: "4px" }}>
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order type breakdown */}
            <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6">
              <h2 className="font-bold text-stone-900 dark:text-white mb-5">Order Types</h2>
              <div className="space-y-4">
                {[
                  { key: "pickup" as const, label: "Pickup", color: "bg-purple-500" },
                  { key: "delivery" as const, label: "Delivery", color: "bg-blue-500" },
                  { key: "dine_in" as const, label: "Dine In", color: "bg-emerald-500" },
                ].map(({ key, label, color }) => {
                  const count = data.byType[key];
                  const pct = totalByType > 0 ? Math.round((count / totalByType) * 100) : 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{label}</span>
                        <span className="text-sm font-bold text-stone-900 dark:text-white">{count} <span className="text-stone-400 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-2.5 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top menu items */}
            <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6">
              <h2 className="font-bold text-stone-900 dark:text-white mb-5">Top Items</h2>
              {data.topItems.length === 0 ? (
                <p className="text-stone-400 text-sm">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {data.topItems.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-stone-900 dark:text-white truncate">{item.name}</span>
                          <span className="text-xs text-stone-400 ml-2 flex-shrink-0">{item.qty} sold</span>
                        </div>
                        <div className="h-1.5 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{ width: `${(item.qty / maxItems) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 flex-shrink-0">{formatCurrency(item.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Peak hours */}
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6">
            <h2 className="font-bold text-stone-900 dark:text-white mb-6">Peak Hours</h2>
            <div className="flex items-end gap-1 h-32">
              {data.peakHours.map((slot) => {
                const label = slot.hour === 0 ? "12a" : slot.hour < 12 ? `${slot.hour}a` : slot.hour === 12 ? "12p" : `${slot.hour - 12}p`;
                return (
                  <div key={slot.hour} className="flex flex-col items-center gap-1 flex-1 group">
                    <div className="relative w-full flex items-end" style={{ height: "96px" }}>
                      <div
                        className={`w-full rounded-t transition-all ${slot.orders > 0 ? "bg-indigo-500 group-hover:bg-indigo-400" : "bg-stone-100 dark:bg-stone-700"}`}
                        style={{ height: `${Math.max((slot.orders / maxHour) * 96, slot.orders > 0 ? 4 : 2)}px` }}
                      />
                      {slot.orders > 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap pointer-events-none z-10">
                          {slot.orders} orders
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-stone-400">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
