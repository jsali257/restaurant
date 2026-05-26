"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ChefHat,
  Plus,
  Minus,
  Trash2,
  Send,
  UtensilsCrossed,
  X,
  CheckCircle2,
  LayoutGrid,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RESTAURANT_ID, formatCurrency } from "@/lib/utils";
import { MenuItem, MenuCategory, ModifierGroup, Modifier } from "@/types";
import toast from "react-hot-toast";

interface StaffCartItem {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: { modifier_id: string; name: string; price_delta: number }[];
  special_instructions: string;
  item_total: number;
}

interface ModifierModalProps {
  item: MenuItem;
  onConfirm: (modifiers: { modifier_id: string; name: string; price_delta: number }[], instructions: string, qty: number) => void;
  onClose: () => void;
}

function ModifierModal({ item, onConfirm, onClose }: ModifierModalProps) {
  const [selected, setSelected] = useState<Record<string, Modifier>>({});
  const [instructions, setInstructions] = useState("");
  const [qty, setQty] = useState(1);

  const groups: ModifierGroup[] = (item.modifier_groups ?? []).filter(
    (g) => (g.modifiers ?? []).some((m) => m.is_active)
  );
  const hasModifiers = groups.length > 0;

  function toggle(group: ModifierGroup, modifier: Modifier) {
    setSelected((prev) => {
      const next = { ...prev };
      if (group.max_selections === 1) {
        (group.modifiers ?? []).forEach((m) => delete next[m.id]);
        if (!prev[modifier.id]) next[modifier.id] = modifier;
      } else {
        if (prev[modifier.id]) delete next[modifier.id];
        else next[modifier.id] = modifier;
      }
      return next;
    });
  }

  function canConfirm() {
    return groups
      .filter((g) => g.is_required)
      .every((g) => (g.modifiers ?? []).some((m) => selected[m.id]));
  }

  function handleConfirm() {
    const mods = Object.values(selected).map((m) => ({
      modifier_id: m.id,
      name: m.name,
      price_delta: m.price_delta,
    }));
    onConfirm(mods, instructions, qty);
    onClose();
  }

  const extraCost = Object.values(selected).reduce((s, m) => s + m.price_delta, 0);
  const unitPrice = item.price + extraCost;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 text-lg leading-tight">{item.name}</h3>
            <p className="text-gray-500 text-sm mt-0.5">
              {formatCurrency(unitPrice)} each
              {extraCost > 0 && (
                <span className="text-orange-600"> · +{formatCurrency(extraCost)} in add-ons</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quantity */}
          <div>
            <p className="font-semibold text-gray-800 text-sm mb-3">Quantity</p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-600 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-gray-900 font-black text-2xl w-8 text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-gray-400 text-sm ml-2">
                = {formatCurrency(unitPrice * qty)}
              </span>
            </div>
          </div>

          {/* Modifier groups */}
          {groups.map((group) => (
            <div key={group.id}>
              <div className="flex items-center gap-2 mb-3">
                <p className="font-semibold text-gray-800 text-sm">{group.name}</p>
                {group.is_required ? (
                  <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                    Required
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Optional</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(group.modifiers ?? []).filter((m) => m.is_active).map((modifier) => (
                  <button
                    key={modifier.id}
                    onClick={() => toggle(group, modifier)}
                    className={`flex items-start justify-between px-3 py-2.5 rounded-xl border text-sm transition-all text-left ${
                      selected[modifier.id]
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span className="leading-tight">{modifier.name}</span>
                    {modifier.price_delta !== 0 && (
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                        +{formatCurrency(modifier.price_delta)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Special instructions */}
          <div>
            <p className="font-semibold text-gray-800 text-sm mb-2">
              Special Instructions
              {!hasModifiers && (
                <span className="text-gray-400 font-normal ml-2 text-xs">(no onions, extra sauce, allergy…)</span>
              )}
            </p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={
                hasModifiers
                  ? "Any allergy or extra requests..."
                  : "e.g. no onions, extra sauce, well done, allergy to nuts..."
              }
              rows={hasModifiers ? 2 : 3}
              autoFocus={!hasModifiers}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-orange-500 resize-none transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex-shrink-0 space-y-2">
          {groups.some((g) => g.is_required && !(g.modifiers ?? []).some((m) => selected[m.id])) && (
            <p className="text-orange-500 text-xs text-center">
              Please select required options above
            </p>
          )}
          <button
            onClick={handleConfirm}
            disabled={!canConfirm()}
            className="w-full py-3.5 rounded-xl font-bold text-base bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
          >
            Add {qty > 1 ? `${qty}× ` : ""}to Order · {formatCurrency(unitPrice * qty)}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function TableParamReader({ onTable }: { onTable: (t: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const t = searchParams.get("table");
    if (t) onTable(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default function StaffPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableNumber, setTableNumber] = useState<string>("");
  const [customTable, setCustomTable] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<StaffCartItem[]>([]);
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("menu_categories")
        .select("*, menu_items(*, modifier_groups(*, modifiers(*)))")
        .eq("restaurant_id", RESTAURANT_ID)
        .eq("is_active", true)
        .order("sort_order");
      if (data) setCategories(data as MenuCategory[]);
      setLoading(false);
    }
    load();
  }, []);

  const allItems = categories.flatMap((c) =>
    (c.menu_items ?? []).filter((i) => i.is_active)
  );
  const displayItems =
    activeCategory === "all"
      ? allItems
      : (categories.find((c) => c.id === activeCategory)?.menu_items ?? []).filter((i) => i.is_active);

  function openItem(item: MenuItem) {
    setModalItem(item);
  }

  function addToCart(
    item: MenuItem,
    modifiers: { modifier_id: string; name: string; price_delta: number }[],
    instructions: string,
    qty: number = 1
  ) {
    const modTotal = modifiers.reduce((s, m) => s + m.price_delta, 0);
    const unitPrice = parseFloat((item.price + modTotal).toFixed(2));

    setCart((prev) => {
      const existing = prev.find(
        (c) =>
          c.menu_item_id === item.id &&
          JSON.stringify(c.modifiers) === JSON.stringify(modifiers) &&
          c.special_instructions === instructions
      );
      if (existing) {
        const newQty = existing.quantity + qty;
        return prev.map((c) =>
          c.id === existing.id
            ? { ...c, quantity: newQty, item_total: parseFloat((unitPrice * newQty).toFixed(2)) }
            : c
        );
      }
      return [
        ...prev,
        {
          id: `${item.id}-${JSON.stringify(modifiers)}-${instructions}-${Date.now()}`,
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: qty,
          modifiers,
          special_instructions: instructions,
          item_total: parseFloat((unitPrice * qty).toFixed(2)),
        },
      ];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.id !== id) return c;
          const newQty = c.quantity + delta;
          if (newQty <= 0) return null as unknown as StaffCartItem;
          const unitTotal = parseFloat(((c.price + c.modifiers.reduce((s, m) => s + m.price_delta, 0))).toFixed(2));
          return { ...c, quantity: newQty, item_total: parseFloat((unitTotal * newQty).toFixed(2)) };
        })
        .filter(Boolean)
    );
  }

  const subtotal = parseFloat(cart.reduce((s, i) => s + i.item_total, 0).toFixed(2));
  const tax = parseFloat((subtotal * 0.0825).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));

  const activeTable = tableNumber || customTable;

  async function handleSubmit() {
    if (!activeTable) {
      toast.error("Select a table first");
      return;
    }
    if (cart.length === 0) {
      toast.error("Add items to the order");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/dine-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: RESTAURANT_ID,
          table_number: activeTable,
          customer_name: `Table ${activeTable}`,
          customer_email: "",
          items: cart.map((c) => ({
            menu_item_id: c.menu_item_id,
            quantity: c.quantity,
            special_instructions: c.special_instructions || undefined,
            modifiers: c.modifiers,
          })),
          tip_amount: 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send order");

      setSubmitted(data.order_number);
      setCart([]);
      setTableNumber("");
      setCustomTable("");
      setTimeout(() => setSubmitted(null), 4000);
      toast.success(`Order sent to kitchen!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Suspense fallback={null}>
        <TableParamReader
          onTable={(t) => {
            setTableNumber(t);
            setCustomTable("");
          }}
        />
      </Suspense>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm">
        <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-black text-gray-900 text-base">Staff Order Entry</h1>
          <p className="text-gray-400 text-xs">Ember & Oak</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {activeTable && (
            <div className="bg-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-bold">
              Table {activeTable}
            </div>
          )}
          <Link
            href="/staff/tables"
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
            Tables
          </Link>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Table selector + Cart */}
        <div className="w-72 xl:w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
          {/* Table picker */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Select Table
            </p>
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {Array.from({ length: 20 }, (_, i) => String(i + 1)).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTableNumber(t); setCustomTable(""); }}
                  className={`py-2 rounded-lg text-sm font-bold transition-colors ${
                    tableNumber === t
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customTable}
              onChange={(e) => { setCustomTable(e.target.value); setTableNumber(""); }}
              placeholder="Custom table #"
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Cart */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
              Order ({cart.length > 0 ? cart.reduce((s, c) => s + c.quantity, 0) : 0} items)
            </p>
            <AnimatePresence>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No items yet
                </div>
              ) : (
                cart.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 text-sm font-semibold truncate">{item.name}</p>
                        {item.modifiers.length > 0 && (
                          <p className="text-gray-500 text-xs truncate">
                            {item.modifiers.map((m) => m.name).join(", ")}
                          </p>
                        )}
                        {item.special_instructions && (
                          <p className="text-orange-600 text-xs truncate">⚠️ {item.special_instructions}</p>
                        )}
                      </div>
                      <p className="text-orange-600 text-sm font-bold flex-shrink-0">
                        {formatCurrency(item.item_total)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-7 h-7 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-gray-900 font-bold text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-7 h-7 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-gray-600 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setCart((prev) => prev.filter((c) => c.id !== item.id))}
                        className="ml-auto w-7 h-7 bg-red-50 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Totals + submit */}
          <div className="p-4 border-t border-gray-100 space-y-3">
            {cart.length > 0 && (
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Tax (8.25%)</span><span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-bold border-t border-gray-200 pt-1.5">
                  <span>Total</span><span className="text-orange-600">{formatCurrency(total)}</span>
                </div>
              </div>
            )}

            <AnimatePresence>
              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-green-700 text-sm font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Sent! #{submitted?.split("-").pop()}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handleSubmit}
              disabled={submitting || !activeTable || cart.length === 0}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>Sending…</>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send to Kitchen
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Menu */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category tabs */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide flex-shrink-0">
            <button
              onClick={() => setActiveCategory("all")}
              className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeCategory === "all"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200"
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  activeCategory === cat.id
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Items grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl h-28 animate-pulse border border-gray-200" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {displayItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openItem(item)}
                    className="bg-white hover:bg-orange-50 border border-gray-200 hover:border-orange-400 rounded-xl p-4 text-left transition-all active:scale-95 group shadow-sm"
                  >
                    <p className="font-bold text-gray-900 text-sm mb-1 leading-tight group-hover:text-orange-600 transition-colors">
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="text-gray-400 text-xs mb-2 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-orange-600 font-bold text-sm">
                        {formatCurrency(item.price)}
                      </p>
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      {(item.modifier_groups ?? []).length > 0
                        ? "Tap to customize + notes"
                        : "Tap to add notes"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modifier modal */}
      <AnimatePresence>
        {modalItem && (
          <ModifierModal
            item={modalItem}
            onConfirm={(mods, instr, qty) => addToCart(modalItem, mods, instr, qty)}
            onClose={() => setModalItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
