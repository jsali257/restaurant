"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Save, Store, Clock, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RESTAURANT_ID } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface RestaurantForm {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  timezone: string;
  tax_rate: string;
  delivery_fee: string;
  delivery_min_order: string;
  delivery_radius_miles: string;
  accepts_delivery: boolean;
  accepts_pickup: boolean;
  accepts_dine_in: boolean;
}

interface BusinessHour {
  id?: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

const defaultHours: BusinessHour[] = DAYS.map((_, i) => ({
  day_of_week: i,
  open_time: "11:00",
  close_time: "22:00",
  is_closed: i === 0, // Sunday closed by default
}));

const TABS = [
  { id: "info", label: "Restaurant Info", icon: Store },
  { id: "hours", label: "Business Hours", icon: Clock },
  { id: "ordering", label: "Ordering Settings", icon: Truck },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>("info");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<RestaurantForm>({
    name: "", description: "", phone: "", email: "",
    address: "", city: "", state: "", zip: "",
    timezone: "America/Chicago",
    tax_rate: "8.25", delivery_fee: "3.99",
    delivery_min_order: "15.00", delivery_radius_miles: "5.0",
    accepts_delivery: true, accepts_pickup: true, accepts_dine_in: false,
  });
  const [hours, setHours] = useState<BusinessHour[]>(defaultHours);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [restRes, hoursRes] = await Promise.all([
        supabase.from("restaurants").select("*").eq("id", RESTAURANT_ID).single(),
        supabase.from("business_hours").select("*").eq("restaurant_id", RESTAURANT_ID).order("day_of_week"),
      ]);

      if (restRes.data) {
        const r = restRes.data;
        setForm({
          name: r.name ?? "",
          description: r.description ?? "",
          phone: r.phone ?? "",
          email: r.email ?? "",
          address: r.address ?? "",
          city: r.city ?? "",
          state: r.state ?? "",
          zip: r.zip ?? "",
          timezone: r.timezone ?? "America/Chicago",
          tax_rate: r.tax_rate ? String(parseFloat(r.tax_rate) * 100) : "8.25",
          delivery_fee: r.delivery_fee ? String(r.delivery_fee) : "3.99",
          delivery_min_order: r.delivery_min_order ? String(r.delivery_min_order) : "15.00",
          delivery_radius_miles: r.delivery_radius_miles ? String(r.delivery_radius_miles) : "5.0",
          accepts_delivery: r.accepts_delivery ?? true,
          accepts_pickup: r.accepts_pickup ?? true,
          accepts_dine_in: r.accepts_dine_in ?? false,
        });
      }

      if (hoursRes.data && hoursRes.data.length > 0) {
        const dbHours = hoursRes.data;
        setHours(defaultHours.map((def) => {
          const row = dbHours.find((h) => h.day_of_week === def.day_of_week);
          return row
            ? { id: row.id, day_of_week: row.day_of_week, open_time: row.open_time?.slice(0, 5) ?? "11:00", close_time: row.close_time?.slice(0, 5) ?? "22:00", is_closed: row.is_closed }
            : def;
        }));
      }
      setLoading(false);
    }
    load();
  }, []);

  async function saveInfo() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("restaurants").update({
      name: form.name.trim(),
      description: form.description.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      zip: form.zip.trim() || null,
      timezone: form.timezone,
    }).eq("id", RESTAURANT_ID);
    setSaving(false);
    if (error) { toast.error(error.message); } else { toast.success("Restaurant info saved"); }
  }

  async function saveOrdering() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("restaurants").update({
      tax_rate: parseFloat(form.tax_rate) / 100,
      delivery_fee: parseFloat(form.delivery_fee),
      delivery_min_order: parseFloat(form.delivery_min_order),
      delivery_radius_miles: parseFloat(form.delivery_radius_miles),
      accepts_delivery: form.accepts_delivery,
      accepts_pickup: form.accepts_pickup,
      accepts_dine_in: form.accepts_dine_in,
    }).eq("id", RESTAURANT_ID);
    setSaving(false);
    if (error) { toast.error(error.message); } else { toast.success("Ordering settings saved"); }
  }

  async function saveHours() {
    setSaving(true);
    const supabase = createClient();
    const upserts = hours.map((h) => ({
      ...(h.id ? { id: h.id } : {}),
      restaurant_id: RESTAURANT_ID,
      day_of_week: h.day_of_week,
      open_time: h.is_closed ? null : h.open_time,
      close_time: h.is_closed ? null : h.close_time,
      is_closed: h.is_closed,
    }));
    const { error } = await supabase.from("business_hours").upsert(upserts, { onConflict: "restaurant_id,day_of_week" });
    setSaving(false);
    if (error) { toast.error(error.message); } else { toast.success("Business hours saved"); }
  }

  const f = (k: keyof RestaurantForm, v: string | boolean) => setForm((prev) => ({ ...prev, [k]: v }));

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-stone-900 dark:text-white">Settings</h1>
        <p className="text-stone-400 text-sm mt-1">Manage your restaurant configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl mb-8 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id
                ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Restaurant Info */}
      {tab === "info" && (
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-stone-500 mb-1.5 block">Restaurant Name</label>
              <input type="text" value={form.name} onChange={(e) => f("name", e.target.value)} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-stone-500 mb-1.5 block">Description</label>
              <textarea value={form.description} onChange={(e) => f("description", e.target.value)} rows={3} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 mb-1.5 block">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => f("phone", e.target.value)} placeholder="(555) 000-0000" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 mb-1.5 block">Email</label>
              <input type="email" value={form.email} onChange={(e) => f("email", e.target.value)} placeholder="info@restaurant.com" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-stone-500 mb-1.5 block">Street Address</label>
              <input type="text" value={form.address} onChange={(e) => f("address", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 mb-1.5 block">City</label>
              <input type="text" value={form.city} onChange={(e) => f("city", e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1.5 block">State</label>
                <input type="text" value={form.state} onChange={(e) => f("state", e.target.value)} placeholder="TX" maxLength={2} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1.5 block">ZIP</label>
                <input type="text" value={form.zip} onChange={(e) => f("zip", e.target.value)} placeholder="78501" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 mb-1.5 block">Timezone</label>
              <select value={form.timezone} onChange={(e) => f("timezone", e.target.value)} className={inputClass}>
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="America/Phoenix">Arizona (MST)</option>
                <option value="Pacific/Honolulu">Hawaii (HST)</option>
              </select>
            </div>
          </div>
          <Button onClick={saveInfo} loading={saving} className="gap-2">
            <Save className="w-4 h-4" /> Save Info
          </Button>
        </div>
      )}

      {/* Business Hours */}
      {tab === "hours" && (
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6 space-y-3">
          {hours.map((h, idx) => (
            <div key={h.day_of_week} className={`flex items-center gap-4 py-3 ${idx < hours.length - 1 ? "border-b border-stone-100 dark:border-stone-700" : ""}`}>
              <div className="w-28 flex-shrink-0">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{DAYS[h.day_of_week]}</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={h.is_closed}
                  onChange={(e) => setHours((prev) => prev.map((d, i) => i === idx ? { ...d, is_closed: e.target.checked } : d))}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors relative ${h.is_closed ? "bg-red-500" : "bg-stone-200 dark:bg-stone-600"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${h.is_closed ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-xs text-stone-500">{h.is_closed ? "Closed" : "Open"}</span>
              </label>
              {!h.is_closed && (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={h.open_time}
                    onChange={(e) => setHours((prev) => prev.map((d, i) => i === idx ? { ...d, open_time: e.target.value } : d))}
                    className="flex-1 px-2 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                  />
                  <span className="text-stone-400 text-sm">to</span>
                  <input
                    type="time"
                    value={h.close_time}
                    onChange={(e) => setHours((prev) => prev.map((d, i) => i === idx ? { ...d, close_time: e.target.value } : d))}
                    className="flex-1 px-2 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                  />
                </div>
              )}
              {h.is_closed && <div className="flex-1" />}
            </div>
          ))}
          <div className="pt-2">
            <Button onClick={saveHours} loading={saving} className="gap-2">
              <Save className="w-4 h-4" /> Save Hours
            </Button>
          </div>
        </div>
      )}

      {/* Ordering Settings */}
      {tab === "ordering" && (
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 p-6 space-y-6">
          {/* Order types */}
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-white mb-4">Order Types</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: "accepts_pickup" as const, label: "Pickup", desc: "Customers pick up at restaurant" },
                { key: "accepts_delivery" as const, label: "Delivery", desc: "Deliver to customer address" },
                { key: "accepts_dine_in" as const, label: "Dine In", desc: "Table ordering via QR code" },
              ].map(({ key, label, desc }) => (
                <label
                  key={key}
                  className={`flex flex-col gap-1 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    form[key] ? "border-orange-400 bg-orange-50 dark:bg-orange-950/20" : "border-stone-200 dark:border-stone-700 hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-900 dark:text-white text-sm">{label}</span>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${form[key] ? "border-orange-500 bg-orange-500" : "border-stone-300"}`}>
                      {form[key] && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-stone-500">{desc}</span>
                  <input type="checkbox" checked={form[key]} onChange={(e) => f(key, e.target.checked)} className="sr-only" />
                </label>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-white mb-4">Pricing & Fees</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1.5 block">Tax Rate (%)</label>
                <input
                  type="number"
                  value={form.tax_rate}
                  onChange={(e) => f("tax_rate", e.target.value)}
                  step="0.01"
                  min="0"
                  max="30"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1.5 block">Delivery Fee ($)</label>
                <input
                  type="number"
                  value={form.delivery_fee}
                  onChange={(e) => f("delivery_fee", e.target.value)}
                  step="0.01"
                  min="0"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1.5 block">Min Delivery ($)</label>
                <input
                  type="number"
                  value={form.delivery_min_order}
                  onChange={(e) => f("delivery_min_order", e.target.value)}
                  step="0.01"
                  min="0"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-500 mb-1.5 block">Delivery Radius (mi)</label>
                <input
                  type="number"
                  value={form.delivery_radius_miles}
                  onChange={(e) => f("delivery_radius_miles", e.target.value)}
                  step="0.5"
                  min="0"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <Button onClick={saveOrdering} loading={saving} className="gap-2">
            <Save className="w-4 h-4" /> Save Settings
          </Button>
        </div>
      )}
    </div>
  );
}
