import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, CartModifier, Coupon, OrderType } from "@/types";
import { generateId } from "@/lib/utils";

interface CartState {
  items: CartItem[];
  order_type: OrderType;
  table_number: string | null;
  scheduled_for: string | null;
  coupon_code: string | null;
  coupon: Coupon | null;
  special_instructions: string;
  tip_percentage: number;

  // Actions
  addItem: (item: Omit<CartItem, "id" | "item_total">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateSpecialInstructions: (id: string, instructions: string) => void;
  setOrderType: (type: OrderType) => void;
  setTableNumber: (table: string | null) => void;
  setScheduledFor: (time: string | null) => void;
  setCoupon: (code: string | null, coupon: Coupon | null) => void;
  setCartInstructions: (instructions: string) => void;
  setTipPercentage: (pct: number) => void;
  clearCart: () => void;

  // Computed
  getSubtotal: () => number;
  getItemCount: () => number;
}

function computeItemTotal(
  price: number,
  modifiers: CartModifier[],
  quantity: number
): number {
  const modifierTotal = modifiers.reduce((sum, m) => sum + m.price_delta, 0);
  return parseFloat(((price + modifierTotal) * quantity).toFixed(2));
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      order_type: "pickup",
      table_number: null,
      scheduled_for: null,
      coupon_code: null,
      coupon: null,
      special_instructions: "",
      tip_percentage: 18,

      addItem: (itemData) => {
        const existing = get().items.find(
          (i) =>
            i.menu_item_id === itemData.menu_item_id &&
            i.special_instructions === itemData.special_instructions &&
            JSON.stringify(i.selected_modifiers) ===
              JSON.stringify(itemData.selected_modifiers)
        );

        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.id === existing.id
                ? {
                    ...i,
                    quantity: i.quantity + itemData.quantity,
                    item_total: computeItemTotal(
                      i.price,
                      i.selected_modifiers,
                      i.quantity + itemData.quantity
                    ),
                  }
                : i
            ),
          }));
        } else {
          const newItem: CartItem = {
            ...itemData,
            id: generateId(),
            item_total: computeItemTotal(
              itemData.price,
              itemData.selected_modifiers,
              itemData.quantity
            ),
          };
          set((state) => ({ items: [...state.items, newItem] }));
        }
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  quantity,
                  item_total: computeItemTotal(
                    i.price,
                    i.selected_modifiers,
                    quantity
                  ),
                }
              : i
          ),
        }));
      },

      updateSpecialInstructions: (id, instructions) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, special_instructions: instructions } : i
          ),
        })),

      setOrderType: (type) => set({ order_type: type }),
      setTableNumber: (table) => set({ table_number: table, order_type: table ? "dine_in" : "pickup" }),
      setScheduledFor: (time) => set({ scheduled_for: time }),
      setCoupon: (code, coupon) => set({ coupon_code: code, coupon }),
      setCartInstructions: (instructions) =>
        set({ special_instructions: instructions }),
      setTipPercentage: (pct) => set({ tip_percentage: pct }),

      clearCart: () =>
        set({
          items: [],
          table_number: null,
          coupon_code: null,
          coupon: null,
          scheduled_for: null,
          special_instructions: "",
          tip_percentage: 18,
          order_type: "pickup",
        }),

      getSubtotal: () =>
        parseFloat(
          get()
            .items.reduce((sum, i) => sum + i.item_total, 0)
            .toFixed(2)
        ),

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "ember-oak-cart",
      partialize: (state) => ({
        items: state.items,
        order_type: state.order_type,
        table_number: state.table_number,
        scheduled_for: state.scheduled_for,
        coupon_code: state.coupon_code,
        coupon: state.coupon,
        special_instructions: state.special_instructions,
        tip_percentage: state.tip_percentage,
      }),
    }
  )
);
