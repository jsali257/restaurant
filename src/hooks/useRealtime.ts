"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Order } from "@/types";

type RealtimeOrderCallback = (order: Order, event: "INSERT" | "UPDATE") => void;

export function useRealtimeOrders(
  restaurantId: string,
  onEvent: RealtimeOrderCallback
) {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`orders:${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const event = payload.eventType as "INSERT" | "UPDATE";
          if (event === "INSERT" || event === "UPDATE") {
            callbackRef.current(payload.new as Order, event);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);
}

export function useRealtimeOrderStatus(
  orderId: string,
  onUpdate: (order: Order) => void
) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (!orderId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          callbackRef.current(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);
}
