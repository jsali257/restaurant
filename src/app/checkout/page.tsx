"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  ShoppingBag,
  Truck,
  CreditCard,
  Lock,
  CheckCircle2,
  UtensilsCrossed,
  ChefHat,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatCurrency, calculateCartTotal, RESTAURANT_ID } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/customer/Navbar";
import { CartDrawer } from "@/components/customer/CartDrawer";
import toast from "react-hot-toast";

const TAX_RATE = 0.0825;
const DELIVERY_FEE = 3.99;

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  instructions: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const { items, order_type, setOrderType, table_number, coupon, tip_percentage, getSubtotal, clearCart } =
    useCartStore();
  const isDineIn = order_type === "dine_in" && !!table_number;
  const [step, setStep] = useState<"info" | "payment">("info");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "Austin",
    state: "TX",
    zip: "",
    instructions: "",
  });

  const subtotal = getSubtotal();
  const delivery = order_type === "delivery" ? DELIVERY_FEE : 0;
  const tipAmount = parseFloat(((subtotal * tip_percentage) / 100).toFixed(2));
  const discountAmount = coupon
    ? coupon.discount_type === "percentage"
      ? parseFloat(((subtotal * coupon.discount_value) / 100).toFixed(2))
      : Math.min(coupon.discount_value, subtotal)
    : 0;
  const { tax, total } = calculateCartTotal(subtotal, TAX_RATE, delivery, tipAmount, discountAmount);

  function updateInfo(field: keyof CustomerInfo, value: string) {
    setInfo((prev) => ({ ...prev, [field]: value }));
  }

  async function handleProceedToPayment() {
    if (!info.name || !info.email) {
      toast.error("Please fill in your name and email");
      return;
    }
    if (order_type === "delivery" && (!info.address || !info.zip)) {
      toast.error("Please enter your delivery address");
      return;
    }
    setStep("payment");
  }

  async function handlePlaceOrder() {
    setLoading(true);
    try {
      const payload = {
        restaurant_id: RESTAURANT_ID,
        order_type,
        customer_name: info.name,
        customer_email: info.email,
        customer_phone: info.phone || undefined,
        table_number: table_number ?? undefined,
        delivery_address: order_type === "delivery" ? info.address : undefined,
        delivery_city: order_type === "delivery" ? info.city : undefined,
        delivery_state: order_type === "delivery" ? info.state : undefined,
        delivery_zip: order_type === "delivery" ? info.zip : undefined,
        delivery_instructions: info.instructions || undefined,
        items: items.map((i) => ({
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
          special_instructions: i.special_instructions || undefined,
          modifiers: i.selected_modifiers.map((m) => ({
            modifier_id: m.modifier_id,
            name: m.name,
            price_delta: m.price_delta,
          })),
        })),
        coupon_code: coupon?.code,
        tip_amount: tipAmount,
      };

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: payload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      // Redirect to Stripe
      if (data.url) {
        clearCart();
        window.location.href = data.url;
      } else if (data.order_id) {
        clearCart();
        router.push(`/order/${data.order_id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setLoading(false);
    }
  }

  async function handleDineInOrder() {
    if (!info.name) {
      toast.error("Please enter your name");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        restaurant_id: RESTAURANT_ID,
        table_number,
        customer_name: info.name || `Table ${table_number}`,
        customer_email: info.email || undefined,
        customer_phone: info.phone || undefined,
        items: items.map((i) => ({
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
          special_instructions: i.special_instructions || undefined,
          modifiers: i.selected_modifiers.map((m) => ({
            modifier_id: m.modifier_id,
            name: m.name,
            price_delta: m.price_delta,
          })),
        })),
        tip_amount: tipAmount,
        special_instructions: info.instructions || undefined,
      };

      const res = await fetch("/api/orders/dine-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      clearCart();
      router.push(`/order/success?order_id=${data.order_id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <>
        <Navbar onCartOpen={() => setCartOpen(true)} />
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">
              Your cart is empty
            </h2>
            <p className="text-stone-400 mb-6">Add some items before checking out</p>
            <Link href="/menu">
              <Button>Browse Menu</Button>
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

      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back */}
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: Form */}
            <div className="lg:col-span-3 space-y-6">
              <div>
                <h1 className="font-display text-3xl font-bold text-stone-900 dark:text-white mb-1">
                  Checkout
                </h1>
                <p className="text-stone-400 text-sm">
                  <Lock className="w-3 h-3 inline mr-1" /> Secured by Stripe
                </p>
              </div>

              {/* Order type */}
              {isDineIn ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl p-5 border-2 border-emerald-400 flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-800 dark:text-emerald-300 text-lg">
                      Dine In — Table {table_number}
                    </p>
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm">
                      Your order goes straight to the kitchen
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-100 dark:border-stone-800">
                  <h2 className="font-semibold text-stone-900 dark:text-white mb-4">
                    Order Type
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "pickup", label: "Pickup", icon: ShoppingBag, desc: "Ready in ~20 min" },
                      { value: "delivery", label: "Delivery", icon: Truck, desc: "Est. 35–50 min" },
                    ].map(({ value, label, icon: Icon, desc }) => (
                      <button
                        key={value}
                        onClick={() => setOrderType(value as "pickup" | "delivery")}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          order_type === value
                            ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                            : "border-stone-200 dark:border-stone-700 hover:border-orange-300"
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 ${order_type === value ? "text-orange-500" : "text-stone-400"}`}
                        />
                        <span className={`font-semibold text-sm ${order_type === value ? "text-orange-600 dark:text-orange-400" : "text-stone-700 dark:text-stone-300"}`}>
                          {label}
                        </span>
                        <span className="text-xs text-stone-400">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer info */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-100 dark:border-stone-800 space-y-4">
                <h2 className="font-semibold text-stone-900 dark:text-white">
                  Your Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5 block">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={info.name}
                      onChange={(e) => updateInfo("name", e.target.value)}
                      placeholder="Jane Smith"
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5 block">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={info.email}
                      onChange={(e) => updateInfo("email", e.target.value)}
                      placeholder="jane@example.com"
                      className="input-base"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1.5 block">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={info.phone}
                      onChange={(e) => updateInfo("phone", e.target.value)}
                      placeholder="(512) 555-0100"
                      className="input-base"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery address */}
              {order_type === "delivery" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-100 dark:border-stone-800 space-y-4"
                >
                  <h2 className="font-semibold text-stone-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    Delivery Address
                  </h2>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1.5 block">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={info.address}
                      onChange={(e) => updateInfo("address", e.target.value)}
                      placeholder="123 Oak Street, Apt 4B"
                      className="input-base"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-stone-500 mb-1.5 block">City</label>
                      <input
                        type="text"
                        value={info.city}
                        onChange={(e) => updateInfo("city", e.target.value)}
                        className="input-base"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-stone-500 mb-1.5 block">State</label>
                      <input
                        type="text"
                        value={info.state}
                        onChange={(e) => updateInfo("state", e.target.value)}
                        className="input-base"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-stone-500 mb-1.5 block">ZIP *</label>
                      <input
                        type="text"
                        value={info.zip}
                        onChange={(e) => updateInfo("zip", e.target.value)}
                        placeholder="78701"
                        className="input-base"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1.5 block">
                      Delivery Instructions (optional)
                    </label>
                    <textarea
                      value={info.instructions}
                      onChange={(e) => updateInfo("instructions", e.target.value)}
                      placeholder="Gate code, leave at door, etc."
                      rows={2}
                      className="input-base resize-none text-sm"
                    />
                  </div>
                </motion.div>
              )}

              {/* CTA */}
              {isDineIn ? (
                <Button
                  size="lg"
                  onClick={handleDineInOrder}
                  loading={loading}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <ChefHat className="w-5 h-5" />
                  Send Order to Kitchen
                </Button>
              ) : step === "info" ? (
                <Button
                  size="lg"
                  onClick={handleProceedToPayment}
                  className="w-full gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Continue to Payment
                </Button>
              ) : (
                <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-100 dark:border-stone-800 space-y-4">
                  <h2 className="font-semibold text-stone-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-orange-500" />
                    Payment
                  </h2>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    You&apos;ll be securely redirected to Stripe to complete your payment.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-stone-400 bg-stone-50 dark:bg-stone-800 rounded-xl p-3">
                    <Lock className="w-3.5 h-3.5 text-green-500" />
                    256-bit SSL encryption · Powered by Stripe
                  </div>
                  <Button
                    size="lg"
                    onClick={handlePlaceOrder}
                    loading={loading}
                    className="w-full gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    Pay {formatCurrency(total)} Securely
                  </Button>
                  <button
                    onClick={() => setStep("info")}
                    className="w-full text-sm text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    ← Back to Info
                  </button>
                </div>
              )}
            </div>

            {/* Right: Order summary */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 sticky top-24 overflow-hidden">
                <div className="p-5 border-b border-stone-100 dark:border-stone-800">
                  <h2 className="font-semibold text-stone-900 dark:text-white">
                    Order Summary ({items.reduce((s, i) => s + i.quantity, 0)} items)
                  </h2>
                </div>

                <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      {item.image_url && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <span className="text-sm font-medium text-stone-900 dark:text-white truncate">
                            {item.name}
                          </span>
                          <span className="text-sm font-semibold text-stone-900 dark:text-white flex-shrink-0">
                            {formatCurrency(item.item_total)}
                          </span>
                        </div>
                        <span className="text-xs text-stone-400">Qty: {item.quantity}</span>
                        {item.selected_modifiers.length > 0 && (
                          <p className="text-xs text-stone-400 truncate">
                            {item.selected_modifiers.map((m) => m.name).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-5 space-y-2 border-t border-stone-100 dark:border-stone-800">
                  <div className="flex justify-between text-sm text-stone-500 dark:text-stone-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {order_type === "delivery" && (
                    <div className="flex justify-between text-sm text-stone-500 dark:text-stone-400">
                      <span>Delivery Fee</span>
                      <span>{formatCurrency(delivery)}</span>
                    </div>
                  )}
                  {tip_percentage > 0 && (
                    <div className="flex justify-between text-sm text-stone-500 dark:text-stone-400">
                      <span>Tip ({tip_percentage}%)</span>
                      <span>{formatCurrency(tipAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-stone-500 dark:text-stone-400">
                    <span>Tax</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-900 dark:text-white pt-2 border-t border-stone-100 dark:border-stone-800">
                    <span>Total</span>
                    <span className="text-orange-600 dark:text-orange-400 text-lg">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {/* Trust indicators */}
                <div className="px-5 pb-5 space-y-2">
                  {[
                    "Free cancellations within 5 minutes",
                    "Order confirmed instantly via email",
                    "Live order tracking included",
                  ].map((text) => (
                    <div key={text} className="flex items-center gap-2 text-xs text-stone-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
