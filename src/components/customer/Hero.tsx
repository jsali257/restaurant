"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Star, Clock, MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const stats = [
  { icon: Star, label: "Rating", value: "4.9/5" },
  { icon: Clock, label: "Ready in", value: "20 min" },
  { icon: MapPin, label: "Location", value: "Austin, TX" },
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-950/30 to-transparent" />
      </div>

      {/* Animated circles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-red-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        {/* Tag */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium px-4 py-2 rounded-full mb-6"
        >
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Now accepting online orders
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="font-display text-5xl sm:text-6xl lg:text-8xl font-bold text-white leading-tight mb-6"
        >
          Wood-fired
          <br />
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
            Flavors
          </span>
          <br />
          <span className="text-white/90">Crafted</span> with{" "}
          <span className="italic font-normal text-white/80">Passion</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10"
        >
          Modern American cuisine rooted in tradition. Every dish kissed by
          live fire — burgers, pizzas, steaks, and more. Pickup or delivery in
          20 minutes.
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link href="/menu">
            <Button size="lg" className="w-full sm:w-auto gap-2 text-base">
              Order Online
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="#menu-preview">
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
            >
              View Menu
            </Button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-center gap-8 sm:gap-12"
        >
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Icon className="w-4 h-4 text-orange-400" />
                <span className="text-xl font-bold text-white">{value}</span>
              </div>
              <span className="text-xs text-white/50 uppercase tracking-wider">
                {label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/40"
      >
        <ChevronDown className="w-6 h-6" />
      </motion.div>
    </section>
  );
}
