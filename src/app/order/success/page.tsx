"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Navbar } from "@/components/customer/Navbar";
import { CartDrawer } from "@/components/customer/CartDrawer";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    // Trigger confetti via canvas-confetti
    import("canvas-confetti").then((mod) => {
      const confetti = mod.default;
      const end = Date.now() + 3000;
      const colors = ["#f97316", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6"];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    });
  }, []);

  return (
    <>
      <Navbar onCartOpen={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center pt-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="font-display text-4xl font-bold text-stone-900 dark:text-white mb-2">
              Order Placed! 🔥
            </h1>
            <p className="text-stone-500 dark:text-stone-400 mb-2">
              Thank you! Your order is confirmed and our kitchen is already fired up.
            </p>
            <p className="text-sm text-stone-400 mb-8">
              A confirmation has been sent to your email.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-100 dark:border-stone-800 mb-6 space-y-4"
          >
            {[
              { step: "1", text: "Kitchen receives your order instantly" },
              { step: "2", text: "Prep takes about 15–20 minutes" },
              { step: "3", text: "Track your order in real-time below" },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-950/30 rounded-lg flex items-center justify-center flex-shrink-0 text-base">
                  {step}
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-400 text-left">{text}</p>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-3"
          >
            {orderId && (
              <Link href={`/order/${orderId}`}>
                <Button size="lg" className="w-full gap-2">
                  Track Your Order
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            )}
            <Link href="/">
              <Button variant="secondary" size="lg" className="w-full gap-2">
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
