"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  ShoppingCart,
  Flame,
  Leaf,
  Wheat,
  Star,
  Clock,
} from "lucide-react";
import { MenuItem, CartModifier } from "@/types";
import { useCartStore } from "@/store/cart";
import { formatCurrency, getSpiceLabel, generateId } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface MenuCardProps {
  item: MenuItem;
  compact?: boolean;
}

export function MenuCard({ item, compact = false }: MenuCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedModifiers, setSelectedModifiers] = useState<CartModifier[]>(() =>
    item.modifier_groups
      ?.flatMap((g) => g.modifiers?.filter((m) => m.is_default) ?? [])
      .map((m) => ({ modifier_id: m.id, name: m.name, price_delta: m.price_delta })) ?? []
  );
  const [instructions, setInstructions] = useState("");
  const addItem = useCartStore((s) => s.addItem);

  const modifierTotal = selectedModifiers.reduce((s, m) => s + m.price_delta, 0);
  const unitPrice = item.price + modifierTotal;
  const hasModifiers = (item.modifier_groups?.length ?? 0) > 0;

  const unavailable = !item.is_active;

  function handleAddToCart() {
    if (unavailable) return;
    addItem({
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      quantity,
      special_instructions: instructions,
      selected_modifiers: selectedModifiers,
    });
    toast.success(`${item.name} added to cart!`);
    setShowModal(false);
    setQuantity(1);
    setInstructions("");
  }

  function toggleModifier(modifier: CartModifier, group: { max_selections: number; id: string }) {
    const isSelected = selectedModifiers.some((m) => m.modifier_id === modifier.modifier_id);
    if (isSelected) {
      setSelectedModifiers((prev) =>
        prev.filter((m) => m.modifier_id !== modifier.modifier_id)
      );
    } else {
      const groupSelected = selectedModifiers.filter((m) =>
        item.modifier_groups
          ?.find((g) => g.id === group.id)
          ?.modifiers?.some((mod) => mod.id === m.modifier_id)
      );
      if (groupSelected.length >= group.max_selections) {
        setSelectedModifiers((prev) => {
          const withoutGroup = prev.filter(
            (m) =>
              !item.modifier_groups
                ?.find((g) => g.id === group.id)
                ?.modifiers?.some((mod) => mod.id === m.modifier_id)
          );
          return [...withoutGroup, modifier];
        });
      } else {
        setSelectedModifiers((prev) => [...prev, modifier]);
      }
    }
  }

  const card = (
    <motion.div
      layout
      className={`group bg-white dark:bg-stone-900 rounded-2xl overflow-hidden border border-stone-100 dark:border-stone-800 shadow-card transition-all duration-300 ${
        unavailable
          ? "opacity-60 cursor-not-allowed"
          : "hover:shadow-card-hover hover:-translate-y-1 cursor-pointer"
      }`}
      onClick={() => !unavailable && hasModifiers ? setShowModal(true) : undefined}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <div className={compact ? "h-40" : "h-52"}>
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className={`object-cover transition-transform duration-500 ${unavailable ? "grayscale" : "group-hover:scale-105"}`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-950/30 dark:to-red-950/30 flex items-center justify-center">
              <Flame className="w-12 h-12 text-orange-300" />
            </div>
          )}
        </div>

        {/* Unavailable overlay */}
        {unavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="bg-stone-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
              Unavailable
            </span>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {!unavailable && item.is_featured && (
            <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
              <Star className="w-3 h-3 fill-current" /> Featured
            </span>
          )}
          {!unavailable && item.is_popular && !item.is_featured && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
              🔥 Popular
            </span>
          )}
        </div>

        {/* Dietary icons */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          {item.is_vegetarian && (
            <span className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-lg" title="Vegetarian">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </span>
          )}
          {item.is_gluten_free && (
            <span className="w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg" title="Gluten Free">
              <Wheat className="w-3.5 h-3.5 text-white" />
            </span>
          )}
        </div>

        {/* Spice level */}
        {item.spice_level > 0 && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              {"🌶️".repeat(item.spice_level)} {getSpiceLabel(item.spice_level)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-stone-900 dark:text-white text-base leading-tight mb-1">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-stone-500 dark:text-stone-400 text-sm line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-3 text-xs text-stone-400">
          {item.calories && <span>{item.calories} cal</span>}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {item.prep_time_minutes} min
          </span>
        </div>

        {/* Price + Add button */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-xl font-bold text-stone-900 dark:text-white">
              {formatCurrency(item.price)}
            </span>
          </div>

          {unavailable ? (
            <span className="text-xs font-semibold text-stone-400 italic">Unavailable</span>
          ) : hasModifiers ? (
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg">
                <button
                  onClick={(e) => { e.stopPropagation(); setQuantity(Math.max(1, quantity - 1)); }}
                  className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-orange-600 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-5 text-center text-sm font-semibold text-stone-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setQuantity(quantity + 1); }}
                  className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-orange-600 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
                className="gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      {card}

      {/* Modifier Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="relative bg-white dark:bg-stone-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal image */}
              {item.image_url && (
                <div className="relative h-52 rounded-t-2xl overflow-hidden">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h2 className="text-xl font-bold text-white">{item.name}</h2>
                    <p className="text-white/70 text-sm">{formatCurrency(item.price)}</p>
                  </div>
                </div>
              )}

              <div className="p-5 space-y-5">
                {!item.image_url && (
                  <div>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white">{item.name}</h2>
                    <p className="text-stone-500 text-sm mt-1">{formatCurrency(item.price)}</p>
                  </div>
                )}

                {item.description && (
                  <p className="text-stone-500 dark:text-stone-400 text-sm">{item.description}</p>
                )}

                {/* Modifier groups */}
                {item.modifier_groups?.map((group) => (
                  <div key={group.id}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-stone-900 dark:text-white text-sm">
                        {group.name}
                        {group.is_required && (
                          <span className="ml-1.5 text-xs text-red-500">*Required</span>
                        )}
                      </h3>
                      {group.max_selections > 1 && (
                        <span className="text-xs text-stone-400">
                          Choose up to {group.max_selections}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {group.modifiers?.map((modifier) => {
                        const cartMod: CartModifier = {
                          modifier_id: modifier.id,
                          name: modifier.name,
                          price_delta: modifier.price_delta,
                        };
                        const isSelected = selectedModifiers.some(
                          (m) => m.modifier_id === modifier.id
                        );
                        return (
                          <label
                            key={modifier.id}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                              isSelected
                                ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                                : "border-stone-200 dark:border-stone-700 hover:border-orange-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? "border-orange-500 bg-orange-500"
                                    : "border-stone-300"
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                              </div>
                              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                                {modifier.name}
                              </span>
                            </div>
                            {modifier.price_delta !== 0 && (
                              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                                +{formatCurrency(modifier.price_delta)}
                              </span>
                            )}
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={isSelected}
                              onChange={() => toggleModifier(cartMod, group)}
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Special instructions */}
                <div>
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2 block">
                    Special Instructions
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Allergies, substitutions, etc."
                    rows={2}
                    className="input-base resize-none text-sm"
                  />
                </div>

                {/* Quantity + Add */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-9 flex items-center justify-center text-stone-500 hover:text-orange-600 transition-colors rounded-lg hover:bg-white dark:hover:bg-stone-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center font-bold text-stone-900 dark:text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-9 h-9 flex items-center justify-center text-stone-500 hover:text-orange-600 transition-colors rounded-lg hover:bg-white dark:hover:bg-stone-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <Button onClick={handleAddToCart} className="flex-1 gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Add {quantity > 1 ? `${quantity} items` : "to Cart"} —{" "}
                    {formatCurrency(unitPrice * quantity)}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
