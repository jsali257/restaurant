"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Car, Bike, ChevronRight } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const HOURS = [
  { day: "Sunday", open: "11:00", close: "21:00" },
  { day: "Monday", open: "11:00", close: "22:00" },
  { day: "Tuesday", open: "11:00", close: "22:00" },
  { day: "Wednesday", open: "11:00", close: "22:00" },
  { day: "Thursday", open: "11:00", close: "22:00" },
  { day: "Friday", open: "11:00", close: "23:00" },
  { day: "Saturday", open: "11:00", close: "23:00" },
];

function isOpenNow(): boolean {
  const now = new Date();
  const day = now.getDay();
  const hours = HOURS[day];
  if (!hours) return false;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = hours.open.split(":").map(Number);
  const [closeH, closeM] = hours.close.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

export function LocationSection() {
  const today = new Date().getDay();
  const open = isOpenNow();

  return (
    <section id="location" className="py-20 bg-white dark:bg-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-orange-500 font-semibold text-sm uppercase tracking-widest mb-2 block">
            Find Us
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-stone-900 dark:text-white mb-4">
            Visit or Order Online
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Map placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden shadow-card-hover h-96 bg-stone-200 dark:bg-stone-800 relative"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <MapPin className="w-16 h-16 text-orange-400 mb-4" />
              <p className="text-stone-600 dark:text-stone-400 font-medium">1234 Main Street</p>
              <p className="text-stone-500 dark:text-stone-500 text-sm">Austin, TX 78701</p>
              <a
                href="https://maps.google.com/?q=1234+Main+Street+Austin+TX"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4"
              >
                <Button size="sm" variant="outline">
                  Open in Maps
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </a>
            </div>
            {/* Fake map grid overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "linear-gradient(#888 1px, transparent 1px), linear-gradient(90deg, #888 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Status */}
            <div className="flex items-center gap-3">
              <span
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${
                  open
                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
                    : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    open ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`}
                />
                {open ? "Open Now" : "Closed Now"}
              </span>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-950/30 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-stone-900 dark:text-white">
                    1234 Main Street
                  </p>
                  <p className="text-sm text-stone-500">Austin, TX 78701</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-950/30 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <a
                    href="tel:5125550123"
                    className="font-medium text-stone-900 dark:text-white hover:text-orange-600 transition-colors"
                  >
                    (512) 555-0123
                  </a>
                  <p className="text-sm text-stone-500">Call ahead for large groups</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-950/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Car className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-stone-900 dark:text-white">Parking Available</p>
                  <p className="text-sm text-stone-500">
                    Free street parking + lot behind building
                  </p>
                </div>
              </div>
            </div>

            {/* Hours table */}
            <div id="hours" className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-orange-500" />
                <h3 className="font-semibold text-stone-900 dark:text-white">
                  Hours of Operation
                </h3>
              </div>
              <div className="space-y-2">
                {HOURS.map((h, i) => (
                  <div
                    key={h.day}
                    className={`flex items-center justify-between text-sm py-1.5 px-2 rounded-lg transition-colors ${
                      i === today
                        ? "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 font-semibold"
                        : "text-stone-600 dark:text-stone-400"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {i === today && (
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                      )}
                      {h.day}
                    </span>
                    <span>
                      {formatTime(h.open)} – {formatTime(h.close)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
