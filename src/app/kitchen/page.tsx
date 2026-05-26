"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Flame, Volume2, VolumeX, Bell, Ban, ChefHat,
  UtensilsCrossed, ShoppingBag, Truck, ChevronLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeOrders } from "@/hooks/useRealtime";
import { Order, OrderStatus } from "@/types";
import { RESTAURANT_ID } from "@/lib/utils";

type KitchenStatus = "confirmed" | "preparing" | "ready";

const COL_CONFIG: Record<KitchenStatus, {
  label: string; headerBg: string; headerText: string;
  badgeBg: string; btnBg: string; btnText: string; btnLabel: string; emptyBorder: string;
}> = {
  confirmed: {
    label: "New Order",
    headerBg: "bg-red-500", headerText: "text-white",
    badgeBg: "bg-red-600", btnBg: "bg-red-500 hover:bg-red-600", btnText: "text-white",
    btnLabel: "Start Preparing", emptyBorder: "border-red-200",
  },
  preparing: {
    label: "Preparing",
    headerBg: "bg-amber-400", headerText: "text-amber-900",
    badgeBg: "bg-amber-500", btnBg: "bg-amber-400 hover:bg-amber-500", btnText: "text-amber-900",
    btnLabel: "Mark Ready", emptyBorder: "border-amber-200",
  },
  ready: {
    label: "Ready",
    headerBg: "bg-green-500", headerText: "text-white",
    badgeBg: "bg-green-600", btnBg: "bg-green-500 hover:bg-green-600", btnText: "text-white",
    btnLabel: "Complete", emptyBorder: "border-green-200",
  },
};

const NEXT_STATUS: Record<KitchenStatus, OrderStatus> = {
  confirmed: "preparing",
  preparing: "ready",
  ready: "picked_up",
};

const PREV_STATUS: Partial<Record<KitchenStatus, OrderStatus>> = {
  preparing: "confirmed",
  ready: "preparing",
};

function ElapsedTimer({ since }: { since: string }) {
  const [mins, setMins] = useState(0);

  useEffect(() => {
    function calc() {
      setMins(Math.floor((Date.now() - new Date(since).getTime()) / 60000));
    }
    calc();
    const t = setInterval(calc, 30000);
    return () => clearInterval(t);
  }, [since]);

  const isLate = mins >= 20;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isLate ? "bg-red-100 text-red-600" : "bg-white/30 text-inherit"}`}>
      ⏱ {mins}m
    </span>
  );
}

interface CardProps {
  order: Order;
  onStatusChange: (id: string, status: OrderStatus) => Promise<void>;
}

function KitchenCard({ order, onStatusChange }: CardProps) {
  const [updating, setUpdating] = useState(false);
  const [confirmVoid, setConfirmVoid] = useState(false);
  const status = order.status as KitchenStatus;
  const cfg = COL_CONFIG[status];
  const isDineIn = order.order_type === "dine_in";
  const orderShort = order.order_number?.split("-").pop() ?? order.order_number;

  async function advance() {
    setUpdating(true);
    await onStatusChange(order.id, NEXT_STATUS[status]);
    setUpdating(false);
  }

  async function goBack() {
    const prev = PREV_STATUS[status];
    if (!prev) return;
    setUpdating(true);
    await onStatusChange(order.id, prev);
    setUpdating(false);
  }

  async function voidOrder() {
    setUpdating(true);
    await onStatusChange(order.id, "cancelled" as OrderStatus);
    setUpdating(false);
    setConfirmVoid(false);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Colored header */}
      <div className={`${cfg.headerBg} ${cfg.headerText} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            {isDineIn ? (
              <>
                <UtensilsCrossed className="w-4 h-4" />
                <span>Table {order.table_number ?? "?"}</span>
              </>
            ) : order.order_type === "delivery" ? (
              <>
                <Truck className="w-4 h-4" />
                <span>{order.customer_name}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>{order.customer_name}</span>
              </>
            )}
          </div>
          <ElapsedTimer since={order.created_at} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs opacity-80 font-medium">KOT #{orderShort}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isDineIn ? "bg-white/20" :
            order.order_type === "delivery" ? "bg-blue-600/30" : "bg-purple-600/30"
          }`}>
            {isDineIn ? "Dine In" : order.order_type === "delivery" ? "Delivery" : "Pickup"}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-2.5 min-h-[80px]">
        {order.order_items?.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${
                status === "confirmed" ? "bg-red-400" :
                status === "preparing" ? "bg-amber-400" : "bg-green-400"
              }`} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-snug">
                  {item.name}
                  <span className="text-gray-500 font-normal"> × {item.quantity}</span>
                </p>
                {item.order_item_modifiers && item.order_item_modifiers.length > 0 && (
                  <p className="text-xs text-gray-400 italic">
                    {item.order_item_modifiers.map((m) => m.name).join(", ")}
                  </p>
                )}
                {item.special_instructions && (
                  <p className="text-xs text-orange-600 font-medium mt-0.5">
                    ⚠ {item.special_instructions}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={async () => {
                const supabase = createClient();
                const { error } = await supabase
                  .from("menu_items").update({ is_active: false }).eq("id", item.menu_item_id);
                if (error) toast.error("Failed to 86 item");
                else toast.success(`86'd: ${item.name}`);
              }}
              title={`86 ${item.name}`}
              className="flex-shrink-0 text-[10px] font-black text-red-400 border border-red-200 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors flex items-center gap-0.5"
            >
              <Ban className="w-2.5 h-2.5" />86
            </button>
          </div>
        ))}

        {order.special_instructions && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 text-xs text-orange-700 font-medium">
            📝 {order.special_instructions}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 pb-3 pt-1 flex gap-2">
        {confirmVoid ? (
          <>
            <button
              onClick={() => setConfirmVoid(false)}
              className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={voidOrder}
              disabled={updating}
              className="flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wide bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-60"
            >
              {updating ? "Voiding…" : "Confirm Void"}
            </button>
          </>
        ) : (
          <>
            {PREV_STATUS[status] && (
              <button
                onClick={goBack}
                disabled={updating}
                className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <button
              onClick={() => setConfirmVoid(true)}
              disabled={updating}
              className="flex items-center gap-1 text-xs text-red-400 border border-red-200 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors font-medium"
            >
              Void
            </button>
            <button
              onClick={advance}
              disabled={updating}
              className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all ${cfg.btnBg} ${cfg.btnText} disabled:opacity-60`}
            >
              {updating ? (
                <span className="flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating…
                </span>
              ) : status === "ready" ? "Mark Served" : cfg.btnLabel}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [summaryTab, setSummaryTab] = useState<KitchenStatus>("confirmed");
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
      setTimeout(() => setNewOrderAlert(false), 4000);
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
    if (status === "picked_up") update.completed_at = new Date().toISOString();

    await supabase.from("orders").update(update).eq("id", orderId);

    if (status === "picked_up" || status === "cancelled") {
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

  // Aggregate items for the summary panel
  const summaryItems = columns[summaryTab].flatMap((o) => o.order_items ?? [])
    .reduce<Record<string, number>>((acc, item) => {
      acc[item.name] = (acc[item.name] ?? 0) + item.quantity;
      return acc;
    }, {});

  const SUMMARY_LABELS: Record<KitchenStatus, string> = {
    confirmed: "New Order",
    preparing: "Preparing",
    ready: "Ready",
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex flex-col">
      {/* New order alert */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-8 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-base font-bold"
          >
            <Bell className="w-5 h-5 animate-bounce" />
            New Order Incoming!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-base text-gray-900 leading-none">Kitchen Display</h1>
              <p className="text-gray-400 text-xs">Ember & Oak</p>
            </div>
          </div>

          {/* Status count pills */}
          <div className="flex items-center gap-3">
            {(["confirmed", "preparing", "ready"] as KitchenStatus[]).map((s) => (
              <div key={s} className="flex flex-col items-center gap-0.5">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white ${
                  s === "confirmed" ? "bg-red-500" : s === "preparing" ? "bg-amber-400 text-amber-900" : "bg-green-500"
                }`}>
                  {columns[s].length}
                </span>
                <span className="text-xs text-gray-400 font-medium">{COL_CONFIG[s].label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-2 bg-gray-100 rounded-lg px-3 py-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500 font-medium">Live</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadOrders}
              className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                soundEnabled ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
              title="Toggle sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 flex overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <ChefHat className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-400 mb-1">All Clear!</h2>
            <p className="text-gray-300 text-sm">No active orders. New orders appear instantly.</p>
          </div>
        ) : (
          <div className="flex-1 flex min-h-0 gap-0">
            {/* 3 columns */}
            <div className="flex-1 grid grid-cols-3 gap-4 p-4 overflow-y-auto">
              {(["confirmed", "preparing", "ready"] as KitchenStatus[]).map((col) => (
                <div key={col} className="flex flex-col min-w-0">
                  {/* Column header */}
                  <div className={`${COL_CONFIG[col].headerBg} ${COL_CONFIG[col].headerText} rounded-t-xl px-4 py-2.5 flex items-center justify-between mb-0`}>
                    <span className="font-black text-sm uppercase tracking-wider">{COL_CONFIG[col].label}</span>
                    <span className={`w-6 h-6 rounded-full ${COL_CONFIG[col].badgeBg} text-white text-xs font-black flex items-center justify-center`}>
                      {columns[col].length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-3 mt-3">
                    <AnimatePresence mode="popLayout">
                      {columns[col].map((order) => (
                        <KitchenCard
                          key={order.id}
                          order={order}
                          onStatusChange={handleStatusChange}
                        />
                      ))}
                    </AnimatePresence>
                    {columns[col].length === 0 && (
                      <div className={`border-2 border-dashed ${COL_CONFIG[col].emptyBorder} rounded-xl h-24 flex items-center justify-center text-gray-300 text-sm`}>
                        No orders
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Right panel — Item Summary */}
            <div className="w-64 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="font-bold text-gray-800 text-sm">Item Status</h2>
              </div>
              {/* Summary tabs */}
              <div className="flex border-b border-gray-100">
                {(["confirmed", "preparing", "ready"] as KitchenStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSummaryTab(s)}
                    className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                      summaryTab === s
                        ? s === "confirmed" ? "bg-red-50 text-red-600 border-b-2 border-red-500"
                          : s === "preparing" ? "bg-amber-50 text-amber-700 border-b-2 border-amber-400"
                          : "bg-green-50 text-green-700 border-b-2 border-green-500"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {SUMMARY_LABELS[s]}
                  </button>
                ))}
              </div>
              {/* Item list */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Item Name</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {Object.entries(summaryItems).length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-4 py-6 text-center text-gray-300 text-xs">No items</td>
                      </tr>
                    ) : (
                      Object.entries(summaryItems)
                        .sort((a, b) => b[1] - a[1])
                        .map(([name, qty]) => (
                          <tr key={name} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-gray-700 text-xs font-medium">{name}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-gray-900 text-xs">{qty}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
