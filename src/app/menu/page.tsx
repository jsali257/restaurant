"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SlidersHorizontal, Leaf, Flame, Star } from "lucide-react";
import { Navbar } from "@/components/customer/Navbar";
import { CartDrawer } from "@/components/customer/CartDrawer";
import { MenuCard } from "@/components/customer/MenuCard";
import { Footer } from "@/components/customer/Footer";
import { MenuCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { MenuItem, MenuCategory } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { RESTAURANT_ID } from "@/lib/utils";

type Filter = "all" | "vegetarian" | "popular" | "featured" | "spicy";

export default function MenuPage() {
  const [cartOpen, setCartOpen] = useState(false);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    async function loadMenu() {
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
    loadMenu();
  }, []);

  useEffect(() => {
    const handleScroll = () => setSticky(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function scrollToCategory(id: string) {
    setActiveCategory(id);
    const el = categoryRefs.current[id];
    if (el) {
      const offset = 140;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  function filterItems(items: MenuItem[]): MenuItem[] {
    let filtered = items.filter((item) => item.is_active);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }
    if (activeFilter === "vegetarian") filtered = filtered.filter((i) => i.is_vegetarian);
    if (activeFilter === "popular") filtered = filtered.filter((i) => i.is_popular);
    if (activeFilter === "featured") filtered = filtered.filter((i) => i.is_featured);
    if (activeFilter === "spicy") filtered = filtered.filter((i) => i.spice_level > 0);
    return filtered;
  }

  const allItems = categories.flatMap((c) => c.menu_items ?? []);
  const filteredCategories = categories
    .map((c) => ({
      ...c,
      menu_items: filterItems(c.menu_items ?? []),
    }))
    .filter((c) => c.menu_items.length > 0 || (!search && activeFilter === "all"));

  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-stone-900 to-stone-800 dark:from-stone-950 dark:to-stone-900 pt-24 pb-10 px-4 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: "radial-gradient(circle at 50% 120%, #f97316, transparent 60%)" }}
          />
          <div className="relative max-w-2xl mx-auto">
            <span className="text-orange-400 font-semibold text-sm uppercase tracking-widest mb-2 block">
              Our Menu
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
              Order Your Favorites
            </h1>
            <p className="text-stone-400 text-lg">
              Everything made fresh, wood-fired with passion
            </p>
          </div>
        </div>

        {/* Sticky nav bar */}
        <div
          className={`sticky top-16 z-30 bg-white/95 dark:bg-stone-950/95 backdrop-blur-xl border-b border-stone-200 dark:border-stone-800 transition-shadow ${
            sticky ? "shadow-lg" : ""
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Search + filters row */}
            <div className="py-3 flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search menu..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-400 transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter pills */}
              <div className="hidden sm:flex items-center gap-2">
                {[
                  { id: "all", label: "All", icon: null },
                  { id: "vegetarian", label: "Veggie", icon: Leaf },
                  { id: "popular", label: "Popular", icon: Flame },
                  { id: "featured", label: "Featured", icon: Star },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id as Filter)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeFilter === f.id
                        ? "bg-orange-500 text-white shadow-md"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
                    }`}
                  >
                    {f.icon && <f.icon className="w-3.5 h-3.5" />}
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category tabs */}
            {!search && (
              <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-2">
                <button
                  onClick={() => scrollToCategory("all")}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === "all"
                      ? "bg-orange-500 text-white"
                      : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800"
                  }`}
                >
                  All Items
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeCategory === cat.id
                        ? "bg-orange-500 text-white"
                        : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Menu content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <MenuCardSkeleton key={i} />
              ))}
            </div>
          ) : search || activeFilter !== "all" ? (
            /* Search/filter results */
            <div>
              <p className="text-stone-500 text-sm mb-4">
                {filterItems(allItems).length} results
                {search && ` for "${search}"`}
              </p>
              {filterItems(allItems).length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">🍽️</div>
                  <h3 className="text-lg font-semibold text-stone-900 dark:text-white mb-2">
                    No items found
                  </h3>
                  <p className="text-stone-400">Try a different search or filter</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filterItems(allItems).map((item) => (
                    <MenuCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Categories */
            filteredCategories.map((category) => (
              <section
                key={category.id}
                ref={(el) => { categoryRefs.current[category.id] = el; }}
              >
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-stone-400">
                    {category.menu_items?.length ?? 0} items
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  <AnimatePresence>
                    {(category.menu_items ?? []).map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <MenuCard item={item} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
