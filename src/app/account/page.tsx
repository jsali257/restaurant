"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ShoppingBag,
  LogIn,
  LogOut,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  RotateCcw,
  Flame,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, RESTAURANT_ID, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { Navbar } from "@/components/customer/Navbar";
import { CartDrawer } from "@/components/customer/CartDrawer";
import toast from "react-hot-toast";

interface OrderItem {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  special_instructions: string | null;
}

interface PastOrder {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  order_type: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  payment_status: string;
  order_items: OrderItem[];
}

function OrderCard({ order }: { order: PastOrder }) {
  const [expanded, setExpanded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  function handleReorder() {
    order.order_items.forEach((item) => {
      addItem({
        menu_item_id: item.menu_item_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        special_instructions: item.special_instructions || "",
        selected_modifiers: [],
        image_url: null,
      });
    });
    toast.success("Items added to cart!");
  }

  const date = new Date(order.created_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-950/40 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-stone-900 dark:text-white text-sm">{order.order_number}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS] ?? "bg-stone-100 text-stone-600 border-stone-200"}`}>
                {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] ?? order.status}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock className="w-3 h-3 text-stone-400" />
              <span className="text-xs text-stone-400">
                {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="text-xs text-stone-300">·</span>
              <span className="text-xs text-stone-400 capitalize">{order.order_type.replace("_", " ")}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <p className="font-black text-stone-900 dark:text-white">{formatCurrency(order.total)}</p>
          {expanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
        </div>
      </div>

      {/* Expanded items */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 border-t border-stone-100 dark:border-stone-800">
              <div className="pt-3 space-y-2 mb-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-5 bg-stone-100 dark:bg-stone-700 rounded text-xs font-bold text-stone-600 dark:text-stone-300 flex items-center justify-center flex-shrink-0">
                        {item.quantity}
                      </span>
                      <span className="text-stone-700 dark:text-stone-300">{item.name}</span>
                    </div>
                    <span className="text-stone-500 text-xs font-medium">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-stone-100 dark:border-stone-800 pt-3 space-y-1 text-xs text-stone-400 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span><span>{formatCurrency(order.tax_amount)}</span>
                </div>
                <div className="flex justify-between font-bold text-stone-900 dark:text-white text-sm pt-1">
                  <span>Total</span><span>{formatCurrency(order.total)}</span>
                </div>
              </div>
              <button
                onClick={handleReorder}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reorder
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AccountPage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [orders, setOrders] = useState<PastOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // Auth form state
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        setUser({ id: u.id, email: u.email! });
        await loadOrders(u.id);
      }
      setLoading(false);
    }
    init();
  }, []);

  async function loadOrders(userId: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(id, menu_item_id, name, price, quantity, subtotal, special_instructions)")
      .eq("restaurant_id", RESTAURANT_ID)
      .order("created_at", { ascending: false })
      .limit(50);
    setOrders((data as PastOrder[]) ?? []);
  }

  async function handleSignIn() {
    setAuthLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      setUser({ id: data.user.id, email: data.user.email! });
      await loadOrders(data.user.id);
      toast.success("Signed in!");
    }
    setAuthLoading(false);
  }

  async function handleSignUp() {
    setAuthLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      if (data.session) {
        setUser({ id: data.user.id, email: data.user.email! });
        await loadOrders(data.user.id);
        toast.success("Account created!");
      } else {
        toast.success("Check your email to confirm your account!");
      }
    }
    setAuthLoading(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setOrders([]);
    toast.success("Signed out");
  }

  if (loading) {
    return (
      <>
        <Navbar onCartOpen={() => setCartOpen(true)} />
        <div className="min-h-screen flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
        </div>
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      </>
    );
  }

  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4">

          {!user ? (
            /* Auth form */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-card overflow-hidden"
            >
              <div className="px-8 pt-8 pb-6 text-center border-b border-stone-100 dark:border-stone-800">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Flame className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-black text-stone-900 dark:text-white mb-1">My Account</h1>
                <p className="text-stone-500 text-sm">Sign in to view your order history and reorder your favorites</p>
              </div>

              {/* Mode toggle */}
              <div className="flex border-b border-stone-100 dark:border-stone-800">
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                      mode === m
                        ? "border-b-2 border-orange-500 text-orange-600"
                        : "text-stone-400 hover:text-stone-600"
                    }`}
                  >
                    {m === "signin" ? "Sign In" : "Create Account"}
                  </button>
                ))}
              </div>

              <div className="p-8 space-y-4">
                {mode === "signup" && (
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1.5 block">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="input-base"
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1.5 block">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="input-base"
                    onKeyDown={(e) => e.key === "Enter" && (mode === "signin" ? handleSignIn() : handleSignUp())}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1.5 block">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-base"
                    onKeyDown={(e) => e.key === "Enter" && (mode === "signin" ? handleSignIn() : handleSignUp())}
                  />
                </div>
                <button
                  onClick={mode === "signin" ? handleSignIn : handleSignUp}
                  disabled={authLoading || !email || !password}
                  className="w-full py-3.5 rounded-xl font-bold text-base bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      {mode === "signin" ? "Sign In" : "Create Account"}
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-stone-400">
                  Orders placed as a guest are automatically linked to your account by email.
                </p>
              </div>
            </motion.div>
          ) : (
            /* Order history */
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-black text-stone-900 dark:text-white">My Orders</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <p className="text-stone-400 text-sm">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors px-3 py-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingBag className="w-14 h-14 text-stone-200 mx-auto mb-4" />
                  <h2 className="text-lg font-bold text-stone-500 mb-2">No orders yet</h2>
                  <p className="text-stone-400 text-sm mb-6">Your past orders will appear here after you place one.</p>
                  <Link
                    href="/menu"
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
                  >
                    Browse the Menu
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
