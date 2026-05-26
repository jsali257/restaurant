"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  ExternalLink,
  DollarSign,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeOrders } from "@/hooks/useRealtime";
import { Order, OrderStatus } from "@/types";
import {
  formatCurrency,
  formatDate,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  RESTAURANT_ID,
} from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

const STATUS_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: "All Orders", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Preparing", value: "preparing" },
  { label: "Ready", value: "ready" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from("orders")
      .select("*, order_items(id, name, quantity, subtotal, special_instructions, order_item_modifiers(name))")
      .eq("restaurant_id", RESTAURANT_ID)
      .order("created_at", { ascending: false })
      .limit(100);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useRealtimeOrders(RESTAURANT_ID, (order, event) => {
    setOrders((prev) => {
      if (event === "INSERT") return [order, ...prev];
      return prev.map((o) => (o.id === order.id ? { ...o, ...order } : o));
    });
  });

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdating(orderId);
    const supabase = createClient();
    const update: Record<string, unknown> = { status };
    if (status === "confirmed") update.accepted_at = new Date().toISOString();
    if (status === "preparing") update.preparing_at = new Date().toISOString();
    if (status === "ready") update.ready_at = new Date().toISOString();
    if (status === "delivered") update.completed_at = new Date().toISOString();

    const { error } = await supabase.from("orders").update(update).eq("id", orderId);
    if (error) {
      toast.error("Failed to update status");
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      toast.success(`Order status updated to ${ORDER_STATUS_LABELS[status]}`);
    }
    setUpdating(null);
  }

  async function handleRefund(order: Order) {
    if (!confirm(`Refund order ${order.order_number}? This will issue a full refund via Stripe.`)) return;
    try {
      const res = await fetch(`/api/orders/${order.id}/refund`, { method: "POST" });
      if (!res.ok) throw new Error("Refund failed");
      toast.success("Refund initiated");
      loadOrders();
    } catch {
      toast.error("Failed to process refund");
    }
  }

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_email.toLowerCase().includes(q)
    );
  });

  const NEXT_STATUS_MAP: Partial<Record<OrderStatus, OrderStatus>> = {
    pending: "confirmed",
    confirmed: "preparing",
    preparing: "ready",
    ready: "delivered",
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white">Orders</h1>
          <p className="text-stone-400 text-sm mt-1">{filtered.length} orders</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadOrders}
          className="gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, names, emails…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === opt.value
                  ? "bg-orange-500 text-white"
                  : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-orange-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-orange-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-400">No orders found</div>
        ) : (
          filtered.map((order) => (
            <motion.div
              key={order.id}
              layout
              className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 overflow-hidden"
            >
              {/* Summary row */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono font-bold text-sm text-stone-900 dark:text-white">
                      {order.order_number}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ORDER_STATUS_COLORS[order.status]}`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    <span className="text-xs text-stone-400 capitalize">{order.order_type.replace("_", " ")}</span>
                    {order.order_type === "dine_in" && order.table_number && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Table {order.table_number}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                    {order.customer_name} · {order.customer_email}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-stone-900 dark:text-white">
                    {formatCurrency(order.total)}
                  </p>
                  <p className="text-xs text-stone-400">{formatDate(order.created_at)}</p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-stone-400 transition-transform flex-shrink-0 ${
                    expandedId === order.id ? "rotate-180" : ""
                  }`}
                />
              </div>

              {/* Expanded */}
              {expandedId === order.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-stone-100 dark:border-stone-700 px-5 py-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Items */}
                    <div>
                      <h3 className="font-semibold text-stone-900 dark:text-white text-sm mb-3">
                        Order Items
                      </h3>
                      <div className="space-y-2">
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-stone-600 dark:text-stone-400">
                              {item.quantity}× {item.name}
                            </span>
                            <span className="font-medium text-stone-900 dark:text-white">
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Info + actions */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-stone-900 dark:text-white text-sm mb-2">
                          Customer Info
                        </h3>
                        <div className="text-sm text-stone-500 dark:text-stone-400 space-y-1">
                          <p>📧 {order.customer_email}</p>
                          {order.customer_phone && <p>📱 {order.customer_phone}</p>}
                          {order.delivery_address && (
                            <p>📍 {order.delivery_address}, {order.delivery_city} {order.delivery_state} {order.delivery_zip}</p>
                          )}
                          {order.special_instructions && (
                            <p className="text-orange-600 font-medium">
                              📝 {order.special_instructions}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status controls */}
                      <div className="flex flex-wrap gap-2">
                        {NEXT_STATUS_MAP[order.status] && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(order.id, NEXT_STATUS_MAP[order.status]!)}
                            loading={updating === order.id}
                            className="gap-2"
                          >
                            → {ORDER_STATUS_LABELS[NEXT_STATUS_MAP[order.status]!]}
                          </Button>
                        )}
                        {order.status !== "cancelled" && order.status !== "delivered" && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => updateStatus(order.id, "cancelled")}
                            className="gap-2"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel
                          </Button>
                        )}
                        {order.payment_status === "paid" && order.status !== "refunded" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRefund(order)}
                            className="gap-2 text-red-500 hover:text-red-600"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            Refund
                          </Button>
                        )}
                        <a href={`/order/${order.id}`} target="_blank">
                          <Button variant="ghost" size="sm" className="gap-2">
                            <ExternalLink className="w-3.5 h-3.5" />
                            View
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
