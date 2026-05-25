import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { OrderStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready for Pickup",
  picked_up: "Picked Up",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  preparing: "bg-orange-100 text-orange-800 border-orange-200",
  ready: "bg-green-100 text-green-800 border-green-200",
  picked_up: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-teal-100 text-teal-800 border-teal-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-gray-100 text-gray-800 border-gray-200",
};

export const ORDER_STATUS_DOTS: Record<OrderStatus, string> = {
  pending: "bg-yellow-400",
  confirmed: "bg-blue-400",
  preparing: "bg-orange-400",
  ready: "bg-green-400",
  picked_up: "bg-purple-400",
  delivered: "bg-teal-400",
  cancelled: "bg-red-400",
  refunded: "bg-gray-400",
};

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function getSpiceLabel(level: number): string {
  const labels = ["", "Mild", "Medium", "Hot"];
  return labels[level] || "";
}

export function calculateCartTotal(
  subtotal: number,
  taxRate: number,
  deliveryFee: number,
  tipAmount: number,
  discountAmount: number
) {
  const tax = subtotal * taxRate;
  const total = subtotal + tax + deliveryFee + tipAmount - discountAmount;
  return {
    tax: parseFloat(tax.toFixed(2)),
    total: parseFloat(Math.max(0, total).toFixed(2)),
  };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + "…";
}

export function getOrderProgress(status: OrderStatus): number {
  const steps: Record<OrderStatus, number> = {
    pending: 10,
    confirmed: 25,
    preparing: 50,
    ready: 75,
    picked_up: 95,
    delivered: 100,
    cancelled: 0,
    refunded: 0,
  };
  return steps[status] ?? 0;
}

export const RESTAURANT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
