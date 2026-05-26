"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  UtensilsCrossed,
  Clock,
  Plus,
  Minus,
  RefreshCw,
  Receipt,
  CheckCircle2,
  AlertCircle,
  X,
  ChefHat,
  Layers,
  ArrowLeft,
  Users,
  UserCheck,
  SplitSquareHorizontal,
  CreditCard,
  Banknote,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RESTAURANT_ID, formatCurrency } from "@/lib/utils";
import { Order, OrderItem, OrderItemModifier } from "@/types";
import { useRealtimeOrders } from "@/hooks/useRealtime";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

interface TableOrder extends Order {
  order_items: (OrderItem & { order_item_modifiers: OrderItemModifier[] })[];
}

interface TableSession {
  table_number: string;
  orders: TableOrder[];
  opened_at: string;
  subtotal: number;
  tax_total: number;
  grand_total: number;
  item_count: number;
  has_pending_kitchen: boolean; // any order still confirmed/preparing
}

// ── Split-bill helpers ────────────────────────────────────────────────────────

const PAYER_COLORS = [
  { dot: "bg-blue-500",   badge: "bg-blue-50 text-blue-700 border border-blue-200",   header: "bg-blue-500"   },
  { dot: "bg-violet-500", badge: "bg-violet-50 text-violet-700 border border-violet-200", header: "bg-violet-500" },
  { dot: "bg-pink-500",   badge: "bg-pink-50 text-pink-700 border border-pink-200",   header: "bg-pink-500"   },
  { dot: "bg-amber-500",  badge: "bg-amber-50 text-amber-700 border border-amber-200",  header: "bg-amber-500"  },
  { dot: "bg-teal-500",   badge: "bg-teal-50 text-teal-700 border border-teal-200",   header: "bg-teal-500"   },
  { dot: "bg-red-500",    badge: "bg-red-50 text-red-700 border border-red-200",    header: "bg-red-500"    },
];

interface Payer { id: number; name: string }
interface BillUnit {
  id: string;
  name: string;
  mods: string;
  unitPrice: number; // pre-tax price for this one unit
  payerId: number | null;
}

function buildUnits(session: TableSession): BillUnit[] {
  return session.orders.flatMap((order) =>
    (order.order_items ?? []).flatMap((item) => {
      const unitPrice = parseFloat((item.subtotal / item.quantity).toFixed(2));
      return Array.from({ length: item.quantity }, (_, i) => ({
        id: `${item.id}-${i}`,
        name: item.name,
        mods: (item.order_item_modifiers ?? []).map((m) => m.name).join(", "),
        unitPrice,
        payerId: null as number | null,
      }));
    })
  );
}

function payerTotals(
  payers: Payer[],
  units: BillUnit[],
  totalSubtotal: number,
  totalTax: number
) {
  return payers.map((p) => {
    const sub = parseFloat(
      units.filter((u) => u.payerId === p.id).reduce((s, u) => s + u.unitPrice, 0).toFixed(2)
    );
    const tax = totalSubtotal > 0
      ? parseFloat(((sub / totalSubtotal) * totalTax).toFixed(2))
      : 0;
    return { ...p, subtotal: sub, tax, total: parseFloat((sub + tax).toFixed(2)) };
  });
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface CloseBillModalProps {
  session: TableSession;
  onClose: () => void;
  onConfirm: (paymentMethod: "card" | "cash") => Promise<void>;
}

function CloseBillModal({ session, onClose, onConfirm }: CloseBillModalProps) {
  const [mode, setMode] = useState<"together" | "split">("together");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [loading, setLoading] = useState(false);
  const [payers, setPayers] = useState<Payer[]>([
    { id: 0, name: "Person 1" },
    { id: 1, name: "Person 2" },
  ]);
  const [units, setUnits] = useState<BillUnit[]>(() => buildUnits(session));
  const [editingPayer, setEditingPayer] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const nextPayerId = Math.max(...payers.map((p) => p.id)) + 1;
  const unassigned = units.filter((u) => u.payerId === null).length;
  const totals = payerTotals(payers, units, session.subtotal, session.tax_total);

  function cycleUnit(unitId: string) {
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id !== unitId) return u;
        const idx = payers.findIndex((p) => p.id === u.payerId);
        const nextIdx = idx + 1 >= payers.length ? -1 : idx + 1; // -1 = unassigned
        return { ...u, payerId: nextIdx === -1 ? null : payers[nextIdx].id };
      })
    );
  }

  function addPayer() {
    if (payers.length >= 6) return;
    const n = payers.length + 1;
    setPayers((prev) => [...prev, { id: nextPayerId, name: `Person ${n}` }]);
  }

  function removePayer(id: number) {
    setUnits((prev) => prev.map((u) => (u.payerId === id ? { ...u, payerId: null } : u)));
    setPayers((prev) => prev.filter((p) => p.id !== id));
  }

  function startEdit(p: Payer) {
    setEditingPayer(p.id);
    setEditName(p.name);
  }

  function saveEdit() {
    if (editName.trim()) {
      setPayers((prev) =>
        prev.map((p) => (p.id === editingPayer ? { ...p, name: editName.trim() } : p))
      );
    }
    setEditingPayer(null);
  }

  async function handleConfirm() {
    setLoading(true);
    await onConfirm(paymentMethod);
    setLoading(false);
  }

  const allItems = session.orders.flatMap((o, ri) =>
    (o.order_items ?? []).map((item) => ({ ...item, round: ri + 1 }))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200"
      >
        {/* Header */}
        <div className="bg-emerald-500 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-black text-white text-xl">Close Bill</h2>
            <p className="text-emerald-100 font-semibold text-sm">Table {session.table_number}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="px-4 pt-4 flex gap-2 flex-shrink-0">
          <button
            onClick={() => setMode("together")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === "together"
                ? "bg-emerald-500 text-white"
                : "bg-gray-100 text-gray-500 hover:text-gray-700"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Pay Together
          </button>
          <button
            onClick={() => setMode("split")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === "split"
                ? "bg-violet-500 text-white"
                : "bg-gray-100 text-gray-500 hover:text-gray-700"
            }`}
          >
            <SplitSquareHorizontal className="w-4 h-4" />
            Split Bill
          </button>
        </div>

        {/* ── PAY TOGETHER ── */}
        {mode === "together" && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
              {allItems.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3 py-2 border-b border-gray-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-gray-100 rounded text-xs font-bold text-gray-600 flex items-center justify-center flex-shrink-0">
                        {item.quantity}
                      </span>
                      <p className="text-gray-800 text-sm font-medium">{item.name}</p>
                    </div>
                    {item.order_item_modifiers?.length > 0 && (
                      <p className="text-gray-400 text-xs mt-0.5 ml-7">
                        {item.order_item_modifiers.map((m) => m.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm font-semibold flex-shrink-0">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 space-y-3 flex-shrink-0 bg-gray-50">
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Subtotal</span><span>{formatCurrency(session.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Tax (8.25%)</span><span>{formatCurrency(session.tax_total)}</span>
              </div>
              <div className="flex justify-between text-gray-900 font-black text-xl pt-2 border-t border-gray-200">
                <span>Total Due</span>
                <span className="text-emerald-600">{formatCurrency(session.grand_total)}</span>
              </div>
              {/* Payment method */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${paymentMethod === "card" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-400 hover:border-gray-300"}`}
                >
                  <CreditCard className="w-4 h-4" /> Card
                </button>
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${paymentMethod === "cash" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-400 hover:border-gray-300"}`}
                >
                  <Banknote className="w-4 h-4" /> Cash
                </button>
              </div>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-black text-base bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {loading ? "Processing…" : `Mark as Paid (${paymentMethod === "card" ? "Card" : "Cash"}) & Close`}
              </button>
              <button onClick={onClose} className="w-full text-gray-400 hover:text-gray-600 text-sm transition-colors py-1">
                Cancel
              </button>
            </div>
          </>
        )}

        {/* ── SPLIT BILL ── */}
        {mode === "split" && (
          <>
            {/* Payer chips */}
            <div className="px-4 pt-3 pb-2 flex-shrink-0 border-b border-gray-100 bg-gray-50">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Payers — tap an item below to assign it
              </p>
              <div className="flex flex-wrap gap-2">
                {payers.map((p, pi) => {
                  const color = PAYER_COLORS[pi % PAYER_COLORS.length];
                  return (
                    <div key={p.id} className={`flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-semibold ${color.badge}`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color.dot}`} />
                      {editingPayer === p.id ? (
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                          className="bg-transparent outline-none w-20"
                        />
                      ) : (
                        <button onClick={() => startEdit(p)} className="hover:opacity-80">
                          {p.name}
                        </button>
                      )}
                      {payers.length > 2 && (
                        <button
                          onClick={() => removePayer(p.id)}
                          className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
                {payers.length < 6 && (
                  <button
                    onClick={addPayer}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Person
                  </button>
                )}
              </div>
            </div>

            {/* Units assignment list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
              <p className="text-gray-400 text-xs mb-2">
                Tap a row to cycle who pays for it. Each item = one unit.
              </p>
              {units.map((unit) => {
                const payerIdx = payers.findIndex((p) => p.id === unit.payerId);
                const color = payerIdx >= 0 ? PAYER_COLORS[payerIdx % PAYER_COLORS.length] : null;
                const payerName = payerIdx >= 0 ? payers[payerIdx].name : null;

                return (
                  <button
                    key={unit.id}
                    onClick={() => cycleUnit(unit.id)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                      color ? color.badge : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 text-sm font-medium truncate">{unit.name}</p>
                      {unit.mods && (
                        <p className="text-gray-400 text-xs truncate">{unit.mods}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-gray-700 text-sm font-semibold">
                        {formatCurrency(unit.unitPrice)}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full min-w-[72px] text-center ${
                        color ? color.badge : "bg-gray-100 text-gray-400"
                      }`}>
                        {payerName ?? "Unassigned"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Per-payer totals + close */}
            <div className="p-4 border-t border-gray-100 flex-shrink-0 space-y-3 bg-gray-50">
              {unassigned > 0 && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                  <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <p className="text-orange-600 text-xs font-semibold">
                    {unassigned} item{unassigned > 1 ? "s" : ""} still unassigned
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                {totals.map((t, pi) => {
                  const color = PAYER_COLORS[pi % PAYER_COLORS.length];
                  return (
                    <div key={t.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`} />
                        <span className="text-gray-700 font-medium">{t.name}</span>
                        <span className="text-gray-400 text-xs">+tax {formatCurrency(t.tax)}</span>
                      </div>
                      <span className="text-gray-900 font-black">{formatCurrency(t.total)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Payment method */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${paymentMethod === "card" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-400 hover:border-gray-300"}`}
                >
                  <CreditCard className="w-4 h-4" /> Card
                </button>
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${paymentMethod === "cash" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-400 hover:border-gray-300"}`}
                >
                  <Banknote className="w-4 h-4" /> Cash
                </button>
              </div>

              <button
                onClick={handleConfirm}
                disabled={loading || unassigned > 0}
                className="w-full py-3.5 rounded-xl font-black text-base bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {loading ? "Processing…" : "Collected — Close Table"}
              </button>
              <button onClick={onClose} className="w-full text-gray-400 hover:text-gray-600 text-sm transition-colors py-1">
                Cancel
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function TableCard({
  session,
  onCloseBill,
}: {
  session: TableSession;
  onCloseBill: (session: TableSession) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const age = formatDistanceToNow(new Date(session.opened_at), { addSuffix: false });
  const isOld = Date.now() - new Date(session.opened_at).getTime() > 60 * 60 * 1000;

  const allItems = session.orders.flatMap((o) => o.order_items ?? []);

  // Aggregate items by name + modifiers for a compact view
  const aggregated = allItems.reduce<
    { name: string; qty: number; mods: string; subtotal: number }[]
  >((acc, item) => {
    const mods = (item.order_item_modifiers ?? []).map((m) => m.name).join(", ");
    const key = `${item.name}|${mods}`;
    const existing = acc.find((a) => a.name === item.name && a.mods === mods);
    if (existing) {
      existing.qty += item.quantity;
      existing.subtotal += item.subtotal;
    } else {
      acc.push({ name: item.name, qty: item.quantity, mods, subtotal: item.subtotal });
    }
    return acc;
  }, []);

  const kitchenStatus = session.has_pending_kitchen;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm"
    >
      {/* Table header */}
      <div className="bg-emerald-500 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-black text-white leading-none">
            {session.table_number}
          </span>
          <div>
            <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Table</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3 h-3 text-emerald-200" />
              <span className={`text-xs font-semibold ${isOld ? "text-red-200" : "text-emerald-100"}`}>
                {age}
              </span>
              {isOld && <AlertCircle className="w-3 h-3 text-red-200" />}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white">{formatCurrency(session.grand_total)}</p>
          <p className="text-emerald-100 text-xs">{session.item_count} items</p>
        </div>
      </div>

      {/* Kitchen status bar */}
      {kitchenStatus && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-amber-600 text-xs font-semibold">Kitchen preparing items</span>
        </div>
      )}

      {/* Rounds summary */}
      {session.orders.length > 1 && (
        <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-400 text-xs">{session.orders.length} rounds ordered</span>
        </div>
      )}

      {/* Items list */}
      <div className="p-4 flex-1">
        <div className="space-y-2">
          {(expanded ? aggregated : aggregated.slice(0, 4)).map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <span className="w-6 h-5 bg-gray-100 rounded text-xs font-bold text-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {item.qty}
                </span>
                <div className="min-w-0">
                  <p className="text-gray-800 text-sm font-medium leading-tight truncate">{item.name}</p>
                  {item.mods && (
                    <p className="text-gray-400 text-xs truncate">{item.mods}</p>
                  )}
                </div>
              </div>
              <span className="text-gray-500 text-xs font-semibold flex-shrink-0">
                {formatCurrency(item.subtotal)}
              </span>
            </div>
          ))}
          {aggregated.length > 4 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-600 text-xs transition-colors mt-1"
            >
              {expanded ? "Show less" : `+${aggregated.length - 4} more items`}
            </button>
          )}
        </div>
      </div>

      {/* Totals row */}
      <div className="px-4 pb-2 flex justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
        <span>Subtotal {formatCurrency(session.subtotal)}</span>
        <span>Tax {formatCurrency(session.tax_total)}</span>
      </div>

      {/* Actions */}
      <div className="p-4 pt-2 flex gap-2">
        <Link
          href={`/staff?table=${session.table_number}`}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Items
        </Link>
        <button
          onClick={() => onCloseBill(session)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors"
        >
          <Receipt className="w-4 h-4" />
          Close Bill
        </button>
      </div>
    </motion.div>
  );
}

export default function StaffTablesPage() {
  const [sessions, setSessions] = useState<TableSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingSession, setClosingSession] = useState<TableSession | null>(null);

  const buildSessions = (orders: TableOrder[]): TableSession[] => {
    const byTable = new Map<string, TableOrder[]>();
    for (const order of orders) {
      const t = order.table_number ?? "?";
      if (!byTable.has(t)) byTable.set(t, []);
      byTable.get(t)!.push(order);
    }

    return Array.from(byTable.entries())
      .map(([table_number, tableOrders]) => {
        const sorted = [...tableOrders].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const subtotal = parseFloat(tableOrders.reduce((s, o) => s + o.subtotal, 0).toFixed(2));
        const tax_total = parseFloat(tableOrders.reduce((s, o) => s + o.tax_amount, 0).toFixed(2));
        const grand_total = parseFloat(tableOrders.reduce((s, o) => s + o.total, 0).toFixed(2));
        const item_count = tableOrders.reduce(
          (s, o) => s + (o.order_items ?? []).reduce((qs, i) => qs + i.quantity, 0),
          0
        );
        const has_pending_kitchen = tableOrders.some((o) =>
          ["confirmed", "preparing"].includes(o.status)
        );
        return {
          table_number,
          orders: sorted,
          opened_at: sorted[0].created_at,
          subtotal,
          tax_total,
          grand_total,
          item_count,
          has_pending_kitchen,
        };
      })
      .sort((a, b) => new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime());
  };

  const loadOrders = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*, order_item_modifiers(*))")
      .eq("restaurant_id", RESTAURANT_ID)
      .eq("order_type", "dine_in")
      .eq("payment_status", "pending")
      .not("status", "in", '("cancelled","refunded","delivered","picked_up")')
      .order("created_at", { ascending: true });

    if (data) setSessions(buildSessions(data as TableOrder[]));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  useRealtimeOrders(RESTAURANT_ID, (order, event) => {
    if (order.order_type !== "dine_in") return;
    // Re-fetch to keep it simple (avoids partial order_items state)
    loadOrders();
  });

  async function handleCloseBill(session: TableSession, paymentMethod: "card" | "cash") {
    try {
      const res = await fetch("/api/orders/close-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: RESTAURANT_ID,
          table_number: session.table_number,
          payment_method: paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to close table");

      toast.success(`Table ${session.table_number} closed — ${formatCurrency(data.total_charged)} collected`);
      setClosingSession(null);
      setSessions((prev) => prev.filter((s) => s.table_number !== session.table_number));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to close table");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-4 flex-shrink-0 shadow-sm">
        <Link
          href="/staff"
          className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-gray-900 text-base">Table Orders</h1>
            <p className="text-gray-400 text-xs">
              {sessions.length} active {sessions.length === 1 ? "table" : "tables"}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/kitchen"
            target="_blank"
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <ChefHat className="w-4 h-4" />
            Kitchen
          </Link>
          <button
            onClick={loadOrders}
            className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-96 text-center">
            <div className="w-20 h-20 bg-gray-200 rounded-2xl flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-500 mb-2">No Open Tables</h2>
            <p className="text-gray-400 text-sm mb-6">
              All tables are closed. New dine-in orders will appear here.
            </p>
            <Link
              href="/staff"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Start a New Table Order
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {sessions.map((session) => (
                <TableCard
                  key={session.table_number}
                  session={session}
                  onCloseBill={(s) => setClosingSession(s)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Close bill modal */}
      <AnimatePresence>
        {closingSession && (
          <CloseBillModal
            session={closingSession}
            onClose={() => setClosingSession(null)}
            onConfirm={(pm) => handleCloseBill(closingSession, pm)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
