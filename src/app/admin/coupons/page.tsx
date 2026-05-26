"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  RefreshCw,
  X,
  Tag,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Coupon } from "@/types";
import { formatCurrency, RESTAURANT_ID } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface CouponForm {
  code: string;
  description: string;
  discount_type: "percentage" | "fixed" | "free_item";
  discount_value: string;
  min_order_amount: string;
  max_uses: string;
  max_uses_per_user: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
}

const defaultForm: CouponForm = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  min_order_amount: "0",
  max_uses: "",
  max_uses_per_user: "1",
  starts_at: new Date().toISOString().slice(0, 16),
  expires_at: "",
  is_active: true,
};

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("restaurant_id", RESTAURANT_ID)
      .order("created_at", { ascending: false });
    setCoupons((data as Coupon[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...defaultForm, code: generateCode() });
    setShowForm(true);
  }

  function openEdit(coupon: Coupon) {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description ?? "",
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order_amount: String(coupon.min_order_amount),
      max_uses: coupon.max_uses ? String(coupon.max_uses) : "",
      max_uses_per_user: String(coupon.max_uses_per_user),
      starts_at: coupon.starts_at.slice(0, 16),
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : "",
      is_active: coupon.is_active,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.code || !form.discount_value) {
      toast.error("Code and discount value are required");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      restaurant_id: RESTAURANT_ID,
      code: form.code.toUpperCase().trim(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      max_uses_per_user: parseInt(form.max_uses_per_user) || 1,
      starts_at: new Date(form.starts_at).toISOString(),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active,
    };

    if (editing) {
      const { error } = await supabase.from("coupons").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Coupon updated");
    } else {
      const { error } = await supabase.from("coupons").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Coupon created");
    }
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function toggleActive(coupon: Coupon) {
    const supabase = createClient();
    await supabase.from("coupons").update({ is_active: !coupon.is_active }).eq("id", coupon.id);
    setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c)));
  }

  async function handleDelete(coupon: Coupon) {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("coupons").delete().eq("id", coupon.id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Coupon deleted");
    setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
  }

  function discountLabel(c: Coupon) {
    if (c.discount_type === "percentage") return `${c.discount_value}% off`;
    if (c.discount_type === "fixed") return `${formatCurrency(c.discount_value)} off`;
    return "Free item";
  }

  function isExpired(c: Coupon) {
    return c.expires_at ? new Date(c.expires_at) < new Date() : false;
  }

  const f = (k: keyof CouponForm, v: string | boolean) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white">Coupons</h1>
          <p className="text-stone-400 text-sm mt-1">{coupons.length} total coupons</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          New Coupon
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-6 h-6 text-orange-400 animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16">
          <Tag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-400">No coupons yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-850">
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider hidden md:table-cell">Description</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider hidden lg:table-cell">Uses</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider hidden lg:table-cell">Expires</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-stone-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-stone-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-700">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-900 dark:text-white">{coupon.code}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(coupon.code); toast.success("Copied!"); }}
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-stone-500 dark:text-stone-400 max-w-xs truncate">
                    {coupon.description ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-orange-600">{discountLabel(coupon)}</span>
                    {coupon.min_order_amount > 0 && (
                      <p className="text-xs text-stone-400 mt-0.5">Min {formatCurrency(coupon.min_order_amount)}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-stone-500 dark:text-stone-400">
                    {coupon.uses_count}{coupon.max_uses ? ` / ${coupon.max_uses}` : ""}
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-stone-500 dark:text-stone-400 text-xs">
                    {coupon.expires_at
                      ? <span className={isExpired(coupon) ? "text-red-500 font-semibold" : ""}>{new Date(coupon.expires_at).toLocaleDateString()}</span>
                      : "Never"
                    }
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleActive(coupon)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                        coupon.is_active && !isExpired(coupon)
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}
                    >
                      {coupon.is_active && !isExpired(coupon)
                        ? <><CheckCircle2 className="w-3 h-3" /> Active</>
                        : <><XCircle className="w-3 h-3" /> {isExpired(coupon) ? "Expired" : "Inactive"}</>
                      }
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(coupon)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800">
                <h2 className="font-bold text-lg text-stone-900 dark:text-white">
                  {editing ? "Edit Coupon" : "New Coupon"}
                </h2>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Code */}
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1.5 block">Code *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) => f("code", e.target.value.toUpperCase())}
                      placeholder="SAVE10"
                      className="input-base flex-1 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => f("code", generateCode())}
                      className="px-3 py-2 rounded-xl border border-stone-200 text-stone-500 hover:border-orange-300 text-xs font-medium transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1.5 block">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => f("description", e.target.value)}
                    placeholder="10% off your order"
                    className="input-base"
                  />
                </div>

                {/* Discount type + value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1.5 block">Type *</label>
                    <select
                      value={form.discount_type}
                      onChange={(e) => f("discount_type", e.target.value)}
                      className="input-base"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed ($)</option>
                      <option value="free_item">Free Item</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1.5 block">
                      Value {form.discount_type === "percentage" ? "(%)" : form.discount_type === "fixed" ? "($)" : "(qty)"}
                    </label>
                    <input
                      type="number"
                      value={form.discount_value}
                      onChange={(e) => f("discount_value", e.target.value)}
                      placeholder={form.discount_type === "percentage" ? "10" : "5.00"}
                      step={form.discount_type === "fixed" ? "0.01" : "1"}
                      min="0"
                      className="input-base"
                    />
                  </div>
                </div>

                {/* Min order + max uses */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1.5 block">Min Order ($)</label>
                    <input
                      type="number"
                      value={form.min_order_amount}
                      onChange={(e) => f("min_order_amount", e.target.value)}
                      placeholder="0"
                      step="0.01"
                      min="0"
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1.5 block">Max Total Uses</label>
                    <input
                      type="number"
                      value={form.max_uses}
                      onChange={(e) => f("max_uses", e.target.value)}
                      placeholder="Unlimited"
                      min="1"
                      className="input-base"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1.5 block">Starts At</label>
                    <input
                      type="datetime-local"
                      value={form.starts_at}
                      onChange={(e) => f("starts_at", e.target.value)}
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1.5 block">Expires At</label>
                    <input
                      type="datetime-local"
                      value={form.expires_at}
                      onChange={(e) => f("expires_at", e.target.value)}
                      className="input-base"
                    />
                  </div>
                </div>

                {/* Active toggle */}
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.is_active ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30" : "border-stone-200 dark:border-stone-700"}`}>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => f("is_active", e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${form.is_active ? "border-orange-500 bg-orange-500" : "border-stone-300"}`}>
                    {form.is_active && (
                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Active</span>
                </label>

                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                  <Button onClick={handleSave} loading={saving} className="flex-1">
                    {editing ? "Save Changes" : "Create Coupon"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
