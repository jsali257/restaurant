"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat,
  RefreshCw,
  Flame,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeOrders } from "@/hooks/useRealtime";
import { Order, OrderStatus } from "@/types";
import { formatCurrency, RESTAURANT_ID } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type KitchenStatus = "confirmed" | "preparing" | "ready";

const STATUS_CONFIG: Record<
  KitchenStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  confirmed: {
    label: "NEW",
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    dot: "bg-yellow-400",
  },
  preparing: {
    label: "PREPARING",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-400",
    dot: "bg-orange-500",
  },
  ready: {
    label: "READY",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-400",
    dot: "bg-green-500",
  },
};

const NEXT_STATUS: Record<KitchenStatus, OrderStatus> = {
  confirmed: "preparing",
  preparing: "ready",
  ready: "completed",
};

const NEXT_LABEL: Record<KitchenStatus, string> = {
  confirmed: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Complete Order",
};

interface KitchenOrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: OrderStatus) => Promise<void>;
}

function KitchenOrderCard({ order, onStatusChange }: KitchenOrderCardProps) {
  const [updating, setUpdating] = useState(false);
  const status = order.status as KitchenStatus;
  const config = STATUS_CONFIG[status];
  const age = formatDistanceToNow(new Date(order.created_at), { addSuffix: true });
  const isOld = Date.now() - new Date(order.created_at).getTime() > 20 * 60 * 1000;

  async function advance() {
    if (!NEXT_STATUS[status]) return;
    setUpdating(true);
    await onStatusChange(order.id, NEXT_STATUS[status]);
    setUpdating(false);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-2xl border-2 ${config.border} ${config.bg} overflow-hidden shadow-md`}
    >
      {/* Card header */}
      <div className="px-5 py-4 border-b border-current/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest ${config.color}`}
              >
                <span className={`w-2 h-2 rounded-full ${config.dot} ${status === "confirmed" ? "animate-pulse" : ""}`} />
                {config.label}
              </span>
              {isOld && (
                <span className="flex items-center gap-1 text-xs text-red-500 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" /> Late
                </span>
              )}
            </div>
            <h3 className="font-black text-2xl text-stone-900">
              #{order.order_number?.split("-").pop()}
            </h3>
          </div>
          <div className="text-right">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                order.order_type === "delivery"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              {order.order_type === "delivery" ? "🛵 Delivery" : "🏃 Pickup"}
            </span>
            <p className="text-xs text-stone-400 mt-1.5 flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3" /> {age}
            </p>
          </div>
        </div>

        {order.customer_name && (
          <p className="text-sm font-medium text-stone-600 mt-2">
            👤 {order.customer_name}
          </p>
        )}
      </div>

      {/* Items */}
      <div className="px-5 py-4 space-y-3">
        {order.order_items?.map((item) => (
          <div key={item.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="w-8 h-8 bg-stone-900 text-white rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0">
                  {item.quantity}
                </span>
                <div>
                  <p className="font-bold text-stone-900 text-base leading-tight">
                    {item.name}
                  </p>
                  {item.order_item_modifiers && item.order_item_modifiers.length > 0 && (
                    <p className="text-xs text-stone-500 mt-0.5">
                      {item.order_item_modifiers.map((m) => m.name).join(" · ")}
                    </p>
                  )}
                  {item.special_instructions && (
                    <p className="text-xs text-orange-600 font-semibold mt-1 bg-orange-50 px-2 py-0.5 rounded-lg">
                      ⚠️ {item.special_instructions}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {order.special_instructions && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-700 font-medium">
            📝 {order.special_instructions}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-4">
        <button
          onClick={advance}
          disabled={updating || status === "ready"}
          className={`w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide transition-all active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed ${
            status === "confirmed"
              ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
              : status === "preparing"
              ? "bg-green-500 hover:bg-green-600 text-white shadow-lg"
              : "bg-stone-200 text-stone-500 cursor-default"
          }`}
        >
          {updating ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Updating…
            </span>
          ) : status === "ready" ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Awaiting Pickup
            </span>
          ) : (
            NEXT_LABEL[status]
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadOrders = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*, order_item_modifiers(*))")
      .eq("restaurant_id", RESTAURANT_ID)
      .in("status", ["confirmed", "preparing", "ready"])
      .order("created_at", { ascending: true });
    if (data) setOrders(data as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  useRealtimeOrders(RESTAURANT_ID, (order, event) => {
    if (event === "INSERT") {
      if (soundEnabled) {
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.5);
        } catch {}
      }
      setNewOrderAlert(true);
      setTimeout(() => setNewOrderAlert(false), 3000);
    }

    if (["confirmed", "preparing", "ready"].includes(order.status)) {
      setOrders((prev) => {
        const idx = prev.findIndex((o) => o.id === order.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...order };
          return next;
        }
        return [order, ...prev];
      });
    } else {
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
    }
  });

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    const supabase = createClient();
    const update: Record<string, unknown> = { status };
    if (status === "preparing") update.preparing_at = new Date().toISOString();
    if (status === "ready") update.ready_at = new Date().toISOString();
    if (status === "completed") update.completed_at = new Date().toISOString();

    await supabase.from("orders").update(update).eq("id", orderId);

    if (status === "completed") {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
    }
  }

  const columns: Record<KitchenStatus, Order[]> = {
    confirmed: orders.filter((o) => o.status === "confirmed"),
    preparing: orders.filter((o) => o.status === "preparing"),
    ready: orders.filter((o) => o.status === "ready"),
  };

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      {/* New order flash */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-orange-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-lg font-bold"
          >
            <Bell className="w-5 h-5 animate-bounce" />
            New Order Incoming!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl text-white">Kitchen Display</h1>
              <p className="text-stone-400 text-xs">Ember & Oak · Live Orders</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-stone-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live
            </div>
            <button
              onClick={loadOrders}
              className="w-9 h-9 bg-stone-800 hover:bg-stone-700 rounded-lg flex items-center justify-center transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-stone-400" />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                soundEnabled
                  ? "bg-orange-600 text-white"
                  : "bg-stone-800 text-stone-400 hover:bg-stone-700"
              }`}
              title="Toggle sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-4 bg-stone-800 rounded-xl px-4 py-2 text-sm">
              <span className="text-stone-400">
                Total active: <span className="text-white font-bold">{orders.length}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ChefHat className="w-20 h-20 text-stone-700 mb-4" />
            <h2 className="text-2xl font-bold text-stone-400 mb-2">All Clear!</h2>
            <p className="text-stone-600">No active orders right now. New orders will appear here instantly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(["confirmed", "preparing", "ready"] as KitchenStatus[]).map((col) => (
              <div key={col}>
                {/* Column header */}
                <div
                  className={`rounded-xl px-4 py-3 mb-4 border-2 flex items-center justify-between ${STATUS_CONFIG[col].border} ${STATUS_CONFIG[col].bg}`}
                >
                  <span className={`font-black text-sm uppercase tracking-widest ${STATUS_CONFIG[col].color} flex items-center gap-2`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[col].dot} ${col === "confirmed" ? "animate-pulse" : ""}`} />
                    {STATUS_CONFIG[col].label}
                  </span>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-sm ${STATUS_CONFIG[col].dot} text-white`}>
                    {columns[col].length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-4 min-h-32">
                  <AnimatePresence mode="popLayout">
                    {columns[col].map((order) => (
                      <KitchenOrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </AnimatePresence>
                  {columns[col].length === 0 && (
                    <div className="border-2 border-dashed border-stone-800 rounded-2xl h-28 flex items-center justify-center text-stone-700 text-sm">
                      No orders here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
