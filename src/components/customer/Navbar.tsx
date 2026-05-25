"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Sun,
  Moon,
  Menu,
  X,
  Flame,
  Phone,
  Clock,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onCartOpen: () => void;
}

const navLinks = [
  { label: "Menu", href: "/menu" },
  { label: "About", href: "#about" },
  { label: "Hours", href: "#hours" },
  { label: "Location", href: "#location" },
  { label: "Contact", href: "#contact" },
];

export function Navbar({ onCartOpen }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/90 dark:bg-stone-950/90 backdrop-blur-xl shadow-lg border-b border-stone-100 dark:border-stone-800"
            : "bg-transparent"
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-glow-orange group-hover:scale-110 transition-transform">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-display font-bold text-xl text-stone-900 dark:text-white leading-tight block">
                  Ember & Oak
                </span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500 leading-none hidden sm:block">
                  Wood-fired · Austin, TX
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Phone */}
              <a
                href="tel:5125550123"
                className="hidden md:flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors px-3 py-2"
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">(512) 555-0123</span>
              </a>

              {/* Theme toggle */}
              {mounted && (
                <button
                  onClick={() =>
                    setTheme(theme === "dark" ? "light" : "dark")
                  }
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Cart */}
              <button
                onClick={onCartOpen}
                className="relative flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-glow-orange active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Order Now</span>
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 text-stone-900 text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </motion.span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-16 z-40 lg:hidden bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 shadow-xl"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center px-4 py-3 text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-xl transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center gap-3 px-4 py-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-stone-500">Today: 11:00 AM – 10:00 PM</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
