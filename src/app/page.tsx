"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flame, Leaf, Zap, Star } from "lucide-react";
import { Navbar } from "@/components/customer/Navbar";
import { Hero } from "@/components/customer/Hero";
import { CartDrawer } from "@/components/customer/CartDrawer";
import { TestimonialsSection } from "@/components/customer/TestimonialsSection";
import { LocationSection } from "@/components/customer/LocationSection";
import { Footer } from "@/components/customer/Footer";
import { MenuCard } from "@/components/customer/MenuCard";
import { Button } from "@/components/ui/Button";
import { MenuItem } from "@/types";

// Static featured items for homepage (no DB dependency)
const FEATURED_ITEMS: MenuItem[] = [
  {
    id: "item-001",
    restaurant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    category_id: "cat-001",
    name: "Truffle Fries",
    description: "Crispy hand-cut fries tossed in truffle oil, parmesan, and fresh herbs. Served with house aioli.",
    price: 12.99,
    image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800",
    is_active: true, is_featured: true, is_popular: true,
    is_vegetarian: true, is_vegan: false, is_gluten_free: false,
    spice_level: 0, calories: 420, prep_time_minutes: 10,
    sort_order: 0, tags: null,
  },
  {
    id: "item-005",
    restaurant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    category_id: "cat-002",
    name: "Margherita Classica",
    description: "San Marzano tomato, fresh buffalo mozzarella, basil, extra virgin olive oil. The perfect classic.",
    price: 18.99,
    image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800",
    is_active: true, is_featured: true, is_popular: true,
    is_vegetarian: true, is_vegan: false, is_gluten_free: false,
    spice_level: 0, calories: 720, prep_time_minutes: 15,
    sort_order: 0, tags: null,
  },
  {
    id: "item-009",
    restaurant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    category_id: "cat-003",
    name: "The Ember Burger",
    description: "Double smash patty, aged cheddar, house special sauce, lettuce, tomato, pickles on a brioche bun.",
    price: 16.99,
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
    is_active: true, is_featured: true, is_popular: true,
    is_vegetarian: false, is_vegan: false, is_gluten_free: false,
    spice_level: 0, calories: 850, prep_time_minutes: 12,
    sort_order: 0, tags: null,
  },
  {
    id: "item-014",
    restaurant_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    category_id: "cat-005",
    name: "12oz Ribeye",
    description: "Wood-fired 12oz prime ribeye, chimichurri, roasted bone marrow butter, seasonal vegetables.",
    price: 48.99,
    image_url: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800",
    is_active: true, is_featured: true, is_popular: true,
    is_vegetarian: false, is_vegan: false, is_gluten_free: false,
    spice_level: 0, calories: 820, prep_time_minutes: 25,
    sort_order: 0, tags: null,
  },
];

const FEATURES = [
  {
    icon: Flame,
    title: "Wood-fired Everything",
    description: "Every dish is kissed by our 900°F oak-fired hearth for unmatched depth of flavor.",
    color: "text-orange-500",
    bg: "bg-orange-100 dark:bg-orange-950/30",
  },
  {
    icon: Leaf,
    title: "Fresh Local Ingredients",
    description: "Sourced daily from Central Texas farms. Seasonal, sustainable, and delicious.",
    color: "text-green-500",
    bg: "bg-green-100 dark:bg-green-950/30",
  },
  {
    icon: Zap,
    title: "Fast Online Ordering",
    description: "Order pickup in under 20 minutes or schedule delivery right to your door.",
    color: "text-yellow-500",
    bg: "bg-yellow-100 dark:bg-yellow-950/30",
  },
  {
    icon: Star,
    title: "Award-winning Quality",
    description: "Austin Chronicle's Best Restaurant 2023 & 2024. 4.9 stars across 2,000+ reviews.",
    color: "text-purple-500",
    bg: "bg-purple-100 dark:bg-purple-950/30",
  },
];

export default function HomePage() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Hero */}
      <Hero />

      {/* Features */}
      <section id="about" className="py-20 bg-stone-50 dark:bg-stone-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-orange-500 font-semibold text-sm uppercase tracking-widest mb-2 block">
              Why Ember & Oak
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-stone-900 dark:text-white mb-4">
              Crafted with Purpose
            </h2>
            <p className="text-stone-500 dark:text-stone-400 text-lg max-w-2xl mx-auto">
              We believe great food starts with great ingredients and great technique.
              Every dish tells a story of fire and flavor.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-card border border-stone-100 dark:border-stone-800 text-center"
              >
                <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="font-bold text-stone-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Menu Preview */}
      <section id="menu-preview" className="py-20 bg-white dark:bg-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10"
          >
            <div>
              <span className="text-orange-500 font-semibold text-sm uppercase tracking-widest mb-2 block">
                Our Menu
              </span>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-stone-900 dark:text-white">
                Customer Favorites
              </h2>
            </div>
            <Link href="/menu">
              <Button variant="outline" className="gap-2">
                View Full Menu
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURED_ITEMS.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <MenuCard item={item} />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link href="/menu">
              <Button size="lg" className="gap-2">
                Order Now — Ready in 20 min
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-orange-500 to-red-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 30% 50%, white 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
              Order in 3 Easy Steps
            </h2>
            <p className="text-white/70 text-lg">From your phone to your door in minutes</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Browse & Build", desc: "Explore our menu, customize your items, and add to cart." },
              { step: "02", title: "Checkout Securely", desc: "Pay with any card via Stripe. Your order is confirmed instantly." },
              { step: "03", title: "Pick Up or Delivery", desc: "Track your order live. Ready in 20 minutes or delivered fresh." },
            ].map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="text-6xl font-black text-white/20 mb-3">{s.step}</div>
                <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                <p className="text-white/70">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSection />
      <LocationSection />
      <Footer />
    </>
  );
}
