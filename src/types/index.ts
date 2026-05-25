// ============================================================
// Core Database Types
// ============================================================

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "picked_up"
  | "delivered"
  | "cancelled"
  | "refunded";

export type OrderType = "pickup" | "delivery" | "dine_in";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";

export type UserRole = "customer" | "staff" | "kitchen" | "admin" | "owner";

export type DiscountType = "percentage" | "fixed" | "free_item";

// ============================================================
// Restaurant
// ============================================================
export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  currency: string;
  tax_rate: number;
  delivery_fee: number;
  delivery_min_order: number;
  delivery_radius_miles: number;
  stripe_account_id: string | null;
  is_active: boolean;
  accepts_delivery: boolean;
  accepts_pickup: boolean;
  accepts_dine_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessHour {
  id: string;
  restaurant_id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

// ============================================================
// Menu
// ============================================================
export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  available_from: string | null;
  available_until: string | null;
  menu_items?: MenuItem[];
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_popular: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  spice_level: number;
  calories: number | null;
  prep_time_minutes: number;
  sort_order: number;
  tags: string[] | null;
  modifier_groups?: ModifierGroup[];
  category?: MenuCategory;
}

export interface ModifierGroup {
  id: string;
  restaurant_id: string;
  menu_item_id: string;
  name: string;
  description: string | null;
  min_selections: number;
  max_selections: number;
  is_required: boolean;
  sort_order: number;
  modifiers?: Modifier[];
}

export interface Modifier {
  id: string;
  group_id: string;
  name: string;
  price_delta: number;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
}

// ============================================================
// Cart (client-side)
// ============================================================
export interface CartModifier {
  modifier_id: string;
  name: string;
  price_delta: number;
}

export interface CartItem {
  id: string; // local uuid
  menu_item_id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  special_instructions: string;
  selected_modifiers: CartModifier[];
  item_total: number; // price + modifier deltas * qty
}

export interface Cart {
  items: CartItem[];
  order_type: OrderType;
  scheduled_for: string | null;
  coupon_code: string | null;
  coupon: Coupon | null;
  special_instructions: string;
}

// ============================================================
// Orders
// ============================================================
export interface Order {
  id: string;
  restaurant_id: string;
  customer_id: string | null;
  order_number: string;
  status: OrderStatus;
  order_type: OrderType;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_zip: string | null;
  delivery_instructions: string | null;
  subtotal: number;
  tax_amount: number;
  delivery_fee: number;
  tip_amount: number;
  discount_amount: number;
  total: number;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  payment_status: PaymentStatus;
  coupon_id: string | null;
  coupon_code: string | null;
  scheduled_for: string | null;
  estimated_ready_at: string | null;
  accepted_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  completed_at: string | null;
  special_instructions: string | null;
  table_number: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  special_instructions: string | null;
  subtotal: number;
  order_item_modifiers?: OrderItemModifier[];
}

export interface OrderItemModifier {
  id: string;
  order_item_id: string;
  modifier_id: string | null;
  name: string;
  price_delta: number;
}

// ============================================================
// Coupons
// ============================================================
export interface Coupon {
  id: string;
  restaurant_id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  max_uses_per_user: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
}

// ============================================================
// Profiles
// ============================================================
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  restaurant_id: string | null;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Reviews
// ============================================================
export interface Review {
  id: string;
  restaurant_id: string;
  customer_id: string | null;
  order_id: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified: boolean;
  is_published: boolean;
  created_at: string;
}

// ============================================================
// API Payloads
// ============================================================
export interface CreateOrderPayload {
  restaurant_id: string;
  order_type: OrderType;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  table_number?: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_zip?: string;
  delivery_instructions?: string;
  items: {
    menu_item_id: string;
    quantity: number;
    special_instructions?: string;
    modifiers: { modifier_id: string; name: string; price_delta: number }[];
  }[];
  coupon_code?: string;
  tip_amount?: number;
  scheduled_for?: string;
  special_instructions?: string;
}

export interface CheckoutSessionPayload {
  order: CreateOrderPayload;
  success_url: string;
  cancel_url: string;
}

// ============================================================
// Analytics
// ============================================================
export interface SalesAnalytics {
  period: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  popular_items: { name: string; count: number; revenue: number }[];
}
