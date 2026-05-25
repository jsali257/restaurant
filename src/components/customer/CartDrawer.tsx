"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Trash2, Plus, Minus, Tag, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { formatCurrency, calculateCartTotal } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { RESTAURANT_ID } from "@/lib/utils";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

const TAX_RATE = 0.0825;
const DELIVERY_FEE = 3.99;

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const {
    items,
    order_type,
    coupon_code,
    coupon,
    tip_percentage,
    getSubtotal,
    getItemCount,
    removeItem,
    updateQuantity,
    setCoupon,
    setTipPercentage,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState(coupon_code ?? "");
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = getSubtotal();
  const delivery = order_type === "delivery" ? DELIVERY_FEE : 0;
  const tipAmount = parseFloat(((subtotal * tip_percentage) / 100).toFixed(2));
  const discountAmount = coupon
    ? coupon.discount_type === "percentage"
      ? parseFloat(((subtotal * coupon.discount_value) / 100).toFixed(2))
      : coupon.discount_type === "fixed"
      ? Math.min(coupon.discount_value, subtotal)
      : 0
    : 0;
  const { tax, total } = calculateCartTotal(
    subtotal,
    TAX_RATE,
    delivery,
    tipAmount,
    discountAmount
  );

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("restaurant_id", RESTAURANT_ID)
        .eq("code", couponInput.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        toast.error("Invalid or expired coupon code");
        return;
      }
      if (data.min_order_amount > subtotal) {
        toast.error(`Minimum order of ${formatCurrency(data.min_order_amount)} required`);
        return;
      }
      if (data.max_uses && data.uses_count >= data.max_uses) {
        toast.error("This coupon has reached its usage limit");
        return;
      }
      setCoupon(data.code, data);
      toast.success(`Coupon applied: ${data.description}`);
    } finally {
      setCouponLoading(false);
    }
  }

  const tipOptions = [0, 15, 18, 20, 25];

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 bg-white dark:bg-stone-950 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-stone-900 dark:text-white">Your Order</h2>
                  <p className="text-xs text-stone-400">{getItemCount()} items</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart className="w-8 h-8 text-stone-300 dark:text-stone-600" />
                  </div>
                  <h3 className="font-semibold text-stone-900 dark:text-white mb-1">
                    Your cart is empty
                  </h3>
                  <p className="text-stone-400 text-sm mb-6">
                    Add some items to get started
                  </p>
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Browse Menu
                  </Button>
                </div>
              ) : (
                <>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-3 bg-stone-50 dark:bg-stone-900 rounded-xl p-3"
                    >
                      {item.image_url && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-stone-900 dark:text-white text-sm leading-tight">
                          {item.name}
                        </h4>
                        {item.selected_modifiers.length > 0 && (
                          <p className="text-xs text-stone-400 mt-0.5 truncate">
                            {item.selected_modifiers.map((m) => m.name).join(", ")}
                          </p>
                        )}
                        {item.special_instructions && (
                          <p className="text-xs text-orange-500 mt-0.5 truncate italic">
                            {item.special_instructions}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-orange-600 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-stone-900 dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-orange-600 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-stone-900 dark:text-white">
                              {formatCurrency(item.item_total)}
                            </span>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-stone-300 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Tip selector */}
                  <div className="bg-stone-50 dark:bg-stone-900 rounded-xl p-4">
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                      Add a Tip
                    </p>
                    <div className="flex gap-2">
                      {tipOptions.map((pct) => (
                        <button
                          key={pct}
                          onClick={() => setTipPercentage(pct)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            tip_percentage === pct
                              ? "bg-orange-500 text-white"
                              : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-orange-300"
                          }`}
                        >
                          {pct === 0 ? "No tip" : `${pct}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Coupon */}
                  <div className="bg-stone-50 dark:bg-stone-900 rounded-xl p-4">
                    <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-orange-500" /> Promo Code
                    </p>
                    {coupon ? (
                      <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                        <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                          ✓ {coupon.code} — {coupon.description}
                        </span>
                        <button
                          onClick={() => { setCoupon(null, null); setCouponInput(""); }}
                          className="text-stone-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                          placeholder="WELCOME20"
                          className="flex-1 input-base text-sm py-2"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={applyCoupon}
                          loading={couponLoading}
                          className="px-4"
                        >
                          Apply
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer totals + CTA */}
            {items.length > 0 && (
              <div className="border-t border-stone-100 dark:border-stone-800 px-6 py-5 space-y-3 bg-white dark:bg-stone-950">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {order_type === "delivery" && (
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Delivery Fee</span>
                      <span>{formatCurrency(delivery)}</span>
                    </div>
                  )}
                  {tip_percentage > 0 && (
                    <div className="flex justify-between text-stone-600 dark:text-stone-400">
                      <span>Tip ({tip_percentage}%)</span>
                      <span>{formatCurrency(tipAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone-600 dark:text-stone-400">
                    <span>Tax (8.25%)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-stone-900 dark:text-white pt-2 border-t border-stone-100 dark:border-stone-800">
                    <span>Total</span>
                    <span className="text-orange-600 dark:text-orange-400">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <Link href="/checkout" onClick={onClose}>
                  <Button size="lg" className="w-full gap-2 text-base">
                    Checkout
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
