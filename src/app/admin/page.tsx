"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
  Clock,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Flame,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Order } from "@/types";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, RESTAURANT_ID } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface Stats {
  todayRevenue: number;
  todayOrders: number;
  weekRevenue: number;
  weekOrders: number;
  avgOrderValue: number;
  pendingOrders: number;
}

const StatCard = ({
  label,
  value,
  subLabel,
  trend,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  subLabel: string;
  trend?: number;
  icon: React.ElementType;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-stone-800 rounded-2xl p-6 border border-stone-100 dark:border-stone-700 shadow-card"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend !== undefined && (
        <div
          className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            trend >= 0
              ? "text-green-600 bg-green-50 dark:bg-green-950/30"
              : "text-red-500 bg-red-50 dark:bg-red-950/30"
          }`}
        >
          {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-2xl font-black text-stone-900 dark:text-white mb-1">{value}</p>
    <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{label}</p>
    <p className="text-xs text-stone-400 mt-1">{subLabel}</p>
  </motion.div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [todayRes, weekRes, recentRes, pendingRes] = await Promise.all([
        supabase
          .from("orders")
          .select("total, status")
          .eq("restaurant_id", RESTAURANT_ID)
          .eq("payment_status", "paid")
          .gte("created_at", today.toISOString()),
        supabase
          .from("orders")
          .select("total")
          .eq("restaurant_id", RESTAURANT_ID)
          .eq("payment_status", "paid")
          .gte("created_at", weekAgo.toISOString()),
        supabase
          .from("orders")
          .select("*, order_items(name, quantity, subtotal)")
          .eq("restaurant_id", RESTAURANT_ID)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("orders")
          .select("id")
          .eq("restaurant_id", RESTAURANT_ID)
          .in("status", ["pending", "confirmed"]),
      ]);

      const todayOrders = todayRes.data ?? [];
      const weekOrders = weekRes.data ?? [];
      const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
      const weekRevenue = weekOrders.reduce((s, o) => s + o.total, 0);

      setStats({
        todayRevenue,
        todayOrders: todayOrders.length,
        weekRevenue,
        weekOrders: weekOrders.length,
        avgOrderValue: weekOrders.length ? weekRevenue / weekOrders.length : 0,
        pendingOrders: pendingRes.data?.length ?? 0,
      });
      setRecentOrders((recentRes.data as Order[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-5 h-5 text-orange-500" />
          <h1 className="text-2xl font-black text-stone-900 dark:text-white">Dashboard</h1>
        </div>
        <p className="text-stone-500 dark:text-stone-400 text-sm">
          Welcome back! Here&apos;s what&apos;s happening at Ember & Oak.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Today's Revenue"
          value={formatCurrency(stats?.todayRevenue ?? 0)}
          subLabel={`${stats?.todayOrders ?? 0} orders today`}
          trend={12}
          icon={DollarSign}
          color="bg-gradient-to-br from-green-400 to-emerald-600"
        />
        <StatCard
          label="Weekly Revenue"
          value={formatCurrency(stats?.weekRevenue ?? 0)}
          subLabel={`${stats?.weekOrders ?? 0} orders this week`}
          trend={8}
          icon={TrendingUp}
          color="bg-gradient-to-br from-orange-400 to-red-500"
        />
        <StatCard
          label="Avg Order Value"
          value={formatCurrency(stats?.avgOrderValue ?? 0)}
          subLabel="Last 7 days"
          trend={-3}
          icon={ShoppingBag}
          color="bg-gradient-to-br from-blue-400 to-indigo-600"
        />
        <StatCard
          label="Pending Orders"
          value={String(stats?.pendingOrders ?? 0)}
          subLabel="Requires action"
          icon={Clock}
          color={
            (stats?.pendingOrders ?? 0) > 0
              ? "bg-gradient-to-br from-yellow-400 to-orange-500"
              : "bg-gradient-to-br from-stone-400 to-stone-600"
          }
        />
      </div>

      {/* Recent orders */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 shadow-card overflow-hidden">
        <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-700 flex items-center justify-between">
          <h2 className="font-bold text-stone-900 dark:text-white">Recent Orders</h2>
          <a
            href="/admin/orders"
            className="text-sm text-orange-500 hover:text-orange-600 font-medium"
          >
            View all →
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 dark:border-stone-700">
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-700">
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-mono font-medium text-stone-900 dark:text-white text-xs">
                      {order.order_number}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-stone-900 dark:text-white">
                        {order.customer_name}
                      </p>
                      <p className="text-xs text-stone-400">{order.customer_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-stone-600 dark:text-stone-400 capitalize">
                      {order.order_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        ORDER_STATUS_COLORS[order.status]
                      }`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-stone-900 dark:text-white">
                      {formatCurrency(order.total)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-stone-400 text-xs whitespace-nowrap">
                    {formatDate(order.created_at)}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400">
                    No orders yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
