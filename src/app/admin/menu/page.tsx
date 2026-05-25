"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Flame,
  RefreshCw,
  X,
  Upload,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MenuItem, MenuCategory } from "@/types";
import { formatCurrency, RESTAURANT_ID } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import toast from "react-hot-toast";

interface MenuItemFormData {
  name: string;
  description: string;
  price: string;
  category_id: string;
  image_url: string;
  is_active: boolean;
  is_featured: boolean;
  is_popular: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  spice_level: number;
  calories: string;
  prep_time_minutes: string;
}

const defaultForm: MenuItemFormData = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  image_url: "",
  is_active: true,
  is_featured: false,
  is_popular: false,
  is_vegetarian: false,
  is_vegan: false,
  is_gluten_free: false,
  spice_level: 0,
  calories: "",
  prep_time_minutes: "15",
};

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuItemFormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    const supabase = createClient();
    const [catRes, itemRes] = await Promise.all([
      supabase
        .from("menu_categories")
        .select("*")
        .eq("restaurant_id", RESTAURANT_ID)
        .order("sort_order"),
      supabase
        .from("menu_items")
        .select("*, menu_categories(name)")
        .eq("restaurant_id", RESTAURANT_ID)
        .order("sort_order"),
    ]);
    setCategories((catRes.data as MenuCategory[]) ?? []);
    setItems((itemRes.data as MenuItem[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...defaultForm, category_id: categories[0]?.id ?? "" });
    setShowForm(true);
  }

  function openEdit(item: MenuItem) {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      category_id: item.category_id,
      image_url: item.image_url ?? "",
      is_active: item.is_active,
      is_featured: item.is_featured,
      is_popular: item.is_popular,
      is_vegetarian: item.is_vegetarian,
      is_vegan: item.is_vegan,
      is_gluten_free: item.is_gluten_free,
      spice_level: item.spice_level,
      calories: item.calories ? String(item.calories) : "",
      prep_time_minutes: String(item.prep_time_minutes),
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name || !form.price || !form.category_id) {
      toast.error("Name, price, and category are required");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      restaurant_id: RESTAURANT_ID,
      category_id: form.category_id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      image_url: form.image_url.trim() || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      is_popular: form.is_popular,
      is_vegetarian: form.is_vegetarian,
      is_vegan: form.is_vegan,
      is_gluten_free: form.is_gluten_free,
      spice_level: form.spice_level,
      calories: form.calories ? parseInt(form.calories) : null,
      prep_time_minutes: parseInt(form.prep_time_minutes) || 15,
    };

    if (editing) {
      const { error } = await supabase.from("menu_items").update(payload).eq("id", editing.id);
      if (error) { toast.error("Failed to update item"); setSaving(false); return; }
      toast.success("Item updated!");
    } else {
      const { error } = await supabase.from("menu_items").insert(payload);
      if (error) { toast.error("Failed to create item"); setSaving(false); return; }
      toast.success("Item created!");
    }
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function toggleActive(item: MenuItem) {
    const supabase = createClient();
    await supabase.from("menu_items").update({ is_active: !item.is_active }).eq("id", item.id);
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i))
    );
  }

  async function handleDelete(item: MenuItem) {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("menu_items").delete().eq("id", item.id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Item deleted");
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  }

  const filtered =
    activeCategory === "all"
      ? items
      : items.filter((i) => i.category_id === activeCategory);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white">Menu Management</h1>
          <p className="text-stone-400 text-sm mt-1">{items.length} items across {categories.length} categories</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">
        <button
          onClick={() => setActiveCategory("all")}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeCategory === "all"
              ? "bg-orange-500 text-white shadow-md"
              : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-orange-300"
          }`}
        >
          All ({items.length})
        </button>
        {categories.map((cat) => {
          const count = items.filter((i) => i.category_id === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 hover:border-orange-300"
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Items table */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-orange-400 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-850">
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider w-12">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider hidden md:table-cell">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-stone-400 uppercase tracking-wider hidden lg:table-cell">
                  Badges
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-700">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-700 flex-shrink-0">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <Flame className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-stone-900 dark:text-white">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-stone-400 line-clamp-1 mt-0.5">{item.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-stone-500 dark:text-stone-400 text-xs">
                      {categories.find((c) => c.id === item.category_id)?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-stone-900 dark:text-white">
                      {formatCurrency(item.price)}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <div className="flex items-center justify-center gap-1.5">
                      {item.is_featured && (
                        <span title="Featured" className="text-yellow-500"><Star className="w-3.5 h-3.5 fill-current" /></span>
                      )}
                      {item.is_vegetarian && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">V</span>
                      )}
                      {item.spice_level > 0 && (
                        <span className="text-xs text-red-500">{"🌶️".repeat(item.spice_level)}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleActive(item)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                        item.is_active
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}
                    >
                      {item.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {item.is_active ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-stone-400">
                    No items in this category
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

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
              className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800">
                <h2 className="font-bold text-lg text-stone-900 dark:text-white">
                  {editing ? "Edit Menu Item" : "Add Menu Item"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Name + Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-stone-500 mb-1.5 block">Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Item name"
                      className="input-base"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-stone-500 mb-1.5 block">Category *</label>
                    <select
                      value={form.category_id}
                      onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                      className="input-base"
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1.5 block">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Describe the dish..."
                    rows={3}
                    className="input-base resize-none"
                  />
                </div>

                {/* Price + Calories + Prep time */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1.5 block">Price ($) *</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1.5 block">Calories</label>
                    <input
                      type="number"
                      value={form.calories}
                      onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))}
                      placeholder="e.g. 450"
                      className="input-base"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 mb-1.5 block">Prep (min)</label>
                    <input
                      type="number"
                      value={form.prep_time_minutes}
                      onChange={(e) => setForm((f) => ({ ...f, prep_time_minutes: e.target.value }))}
                      className="input-base"
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1.5 block">Image URL</label>
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                    className="input-base"
                  />
                  {form.image_url && (
                    <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden">
                      <Image src={form.image_url} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                </div>

                {/* Spice level */}
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-2 block">Spice Level</label>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, spice_level: level }))}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${
                          form.spice_level === level
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-stone-200 text-stone-500 hover:border-stone-300"
                        }`}
                      >
                        {level === 0 ? "None" : "🌶️".repeat(level)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { key: "is_active", label: "Active" },
                    { key: "is_featured", label: "Featured" },
                    { key: "is_popular", label: "Popular" },
                    { key: "is_vegetarian", label: "Vegetarian" },
                    { key: "is_vegan", label: "Vegan" },
                    { key: "is_gluten_free", label: "Gluten Free" },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${
                        form[key as keyof MenuItemFormData]
                          ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30"
                          : "border-stone-200 dark:border-stone-700 hover:border-stone-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!form[key as keyof MenuItemFormData]}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, [key]: e.target.checked }))
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          form[key as keyof MenuItemFormData]
                            ? "border-orange-500 bg-orange-500"
                            : "border-stone-300"
                        }`}
                      >
                        {form[key as keyof MenuItemFormData] && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{label}</span>
                    </label>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    loading={saving}
                    className="flex-1"
                  >
                    {editing ? "Save Changes" : "Create Item"}
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
