"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Sarah M.",
    role: "Regular Customer",
    avatar: "SM",
    rating: 5,
    text: "The wood-fired pizza here is absolutely phenomenal. The char on the crust, the fresh toppings — I've had pizza all over the world and Ember & Oak ranks among the best. The online ordering makes it so easy!",
    item: "Spicy Calabrese Pizza",
  },
  {
    id: 2,
    name: "James R.",
    role: "Food Enthusiast",
    avatar: "JR",
    rating: 5,
    text: "The Ember Burger is a revelation. Double smash patty with that house sauce — I dream about it. Ordered pickup and it was ready exactly on time. This is how online ordering should work.",
    item: "The Ember Burger",
  },
  {
    id: 3,
    name: "Maria G.",
    role: "Austin Local",
    avatar: "MG",
    rating: 5,
    text: "Best ribeye in Austin, hands down. The wood-fired cooking adds such incredible depth of flavor. Their app is seamless and the kitchen team is clearly passionate about every dish.",
    item: "12oz Ribeye",
  },
  {
    id: 4,
    name: "David K.",
    role: "Food Critic",
    avatar: "DK",
    rating: 5,
    text: "Ember & Oak has nailed the balance between comfort food and fine dining. The truffle fries are ridiculous in the best way. Delivery was fast and everything arrived perfectly packaged.",
    item: "Truffle Fries",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-stone-50 to-white dark:from-stone-950 dark:to-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-orange-500 font-semibold text-sm uppercase tracking-widest mb-2 block">
            Reviews
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-stone-900 dark:text-white mb-4">
            What Our Guests Say
          </h2>
          <p className="text-stone-500 dark:text-stone-400 text-lg max-w-2xl mx-auto">
            Over 2,000 five-star reviews on Google and Yelp
          </p>

          {/* Rating summary */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-2xl font-bold text-stone-900 dark:text-white ml-2">
              4.9
            </span>
            <span className="text-stone-400">(2,143 reviews)</span>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-card border border-stone-100 dark:border-stone-800 relative"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-orange-100 dark:text-orange-900" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-stone-600 dark:text-stone-300 text-sm leading-relaxed mb-4">
                "{t.text}"
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-white text-sm">
                      {t.name}
                    </p>
                    <p className="text-xs text-stone-400">{t.role}</p>
                  </div>
                </div>
                <span className="text-xs bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900 px-2.5 py-1 rounded-full font-medium">
                  {t.item}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
