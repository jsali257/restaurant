"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Package,
  Truck,
  Home,
  ArrowLeft,
  Phone,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeOrderStatus } from "@/hooks/useRealtime";
import { Order, OrderStatus } from "@/types";
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/customer/Navbar";
import { CartDrawer } from "@/components/customer/CartDrawer";

const STEPS: { status: OrderStatus; icon: React.ElementType; label: string }[] = [
  { status: "confirmed", icon: CheckCircle2, label: "Order Confirmed" },
  { status: "preparing", icon: ChefHat, label: "Preparing" },
  { status: "ready", icon: Package, label: "Ready for Pickup" },
  { status: "delivered", icon: Home, label: "Delivered" },
];

function getStepIndex(status: OrderStatus): number {
  const order: OrderStatus[] = ["confirmed", "preparing", "ready", "delivered", "picked_up"];
  return order.indexOf(status);
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [cartOpen, setCartOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      const supabase = createClient();
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*, order_item_modifiers(*))")
        .eq("id", id)
        .single();
      if (data) setOrder(data as Order);
      setLoading(false);
    }
    loadOrder();
  }, [id]);

  useRealtimeOrderStatus(id, (updated) => {
    setOrder((prev) => (prev ? { ...prev, ...updated } : updated));
  });

  const stepIndex = order ? getStepIndex(order.status) : -1;
  const isCompleted = order?.status === "delivered" || order?.status === "picked_up";
  const isCancelled = order?.status === "cancelled" || order?.status === "refunded";

  if (loading) {
    return (
      <>
        <Navbar onCartOpen={() => setCartOpen(true)} />
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center pt-20">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-3" />
            <p className="text-stone-400">Loading your order…</p>
          </div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar onCartOpen={() => setCartOpen(true)} />
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-2">Order not found</h2>
            <Link href="/menu">
              <Button>Back to Menu</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 dark:hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Header card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-6 mb-6 text-center ${
              isCompleted
                ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                : isCancelled
                ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                : "bg-gradient-to-br from-orange-500 to-red-600 text-white"
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <h1 className="font-display text-2xl font-bold text-green-800 dark:text-green-300">
                  Order Complete!
                </h1>
                <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                  Enjoy your meal from Ember & Oak 🔥
                </p>
              </>
            ) : isCancelled ? (
              <>
                <div className="text-5xl mb-3">❌</div>
                <h1 className="font-display text-2xl font-bold text-red-800 dark:text-red-300">
                  Order {ORDER_STATUS_LABELS[order.status]}
                </h1>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ChefHat className="w-8 h-8 text-white" />
                </div>
                <h1 className="font-display text-2xl font-bold text-white">
                  {ORDER_STATUS_LABELS[order.status]}
                </h1>
                <p className="text-white/70 text-sm mt-1">
                  Order #{order.order_number}
                </p>
                {order.estimated_ready_at && (
                  <div className="flex items-center justify-center gap-2 mt-3 bg-white/20 rounded-xl px-4 py-2 text-white text-sm">
                    <Clock className="w-4 h-4" />
                    Est. ready: {formatDate(order.estimated_ready_at)}
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Progress tracker */}
          {!isCancelled && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-100 dark:border-stone-800 mb-6"
            >
              <h2 className="font-semibold text-stone-900 dark:text-white mb-6">
                Order Progress
              </h2>
              <div className="relative">
                {/* Progress line */}
                <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-stone-100 dark:bg-stone-800" />
                <div
                  className="absolute left-5 top-5 w-0.5 bg-gradient-to-b from-orange-500 to-red-500 transition-all duration-1000"
                  style={{
                    height: `${Math.min(stepIndex, STEPS.length - 1) * (100 / (STEPS.length - 1))}%`,
                  }}
                />

                <div className="space-y-6">
                  {STEPS.map((step, i) => {
                    const isActive = i === stepIndex;
                    const isDone = i < stepIndex || isCompleted;
                    return (
                      <div key={step.status} className="flex items-start gap-4 relative">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center z-10 flex-shrink-0 transition-all ${
                            isDone
                              ? "bg-gradient-to-br from-orange-500 to-red-500 shadow-glow-orange"
                              : isActive
                              ? "bg-orange-100 dark:bg-orange-950/50 border-2 border-orange-500"
                              : "bg-stone-100 dark:bg-stone-800"
                          }`}
                        >
                          <step.icon
                            className={`w-5 h-5 ${
                              isDone
                                ? "text-white"
                                : isActive
                                ? "text-orange-500"
                                : "text-stone-300 dark:text-stone-600"
                            }`}
                          />
                        </div>
                        <div className="pt-2">
                          <p
                            className={`font-semibold text-sm ${
                              isDone || isActive
                                ? "text-stone-900 dark:text-white"
                                : "text-stone-400 dark:text-stone-600"
                            }`}
                          >
                            {step.label}
                          </p>
                          {isActive && (
                            <p className="text-orange-500 text-xs mt-0.5 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                              In progress…
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Order details */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 overflow-hidden mb-6"
          >
            <div className="p-5 border-b border-stone-100 dark:border-stone-800">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold text-stone-900 dark:text-white">
                    Order Details
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-400">Order #</p>
                  <p className="font-mono font-bold text-sm text-stone-900 dark:text-white">
                    {order.order_number}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-900 dark:text-white">
                      {item.quantity}× {item.name}
                    </p>
                    {item.order_item_modifiers && item.order_item_modifiers.length > 0 && (
                      <p className="text-xs text-stone-400">
                        {item.order_item_modifiers.map((m) => m.name).join(", ")}
                      </p>
                    )}
                    {item.special_instructions && (
                      <p className="text-xs text-orange-500 italic">{item.special_instructions}</p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-stone-900 dark:text-white flex-shrink-0">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-5 pb-5 space-y-2 border-t border-stone-100 dark:border-stone-800 pt-4">
              <div className="flex justify-between text-sm text-stone-500">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              {order.delivery_fee > 0 && (
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(order.delivery_fee)}</span>
                </div>
              )}
              {order.tip_amount > 0 && (
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Tip</span>
                  <span>{formatCurrency(order.tip_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-stone-500">
                <span>Tax</span>
                <span>{formatCurrency(order.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-stone-900 dark:text-white pt-2 border-t border-stone-100 dark:border-stone-800">
                <span>Total</span>
                <span className="text-orange-600 dark:text-orange-400">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Help */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-100 dark:border-stone-800 text-center"
          >
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">
              Questions about your order? We&apos;re here to help.
            </p>
            <a href="tel:5125550123">
              <Button variant="secondary" size="sm" className="gap-2">
                <Phone className="w-4 h-4" />
                Call (512) 555-0123
              </Button>
            </a>
          </motion.div>
        </div>
      </div>
    </>
  );
}
