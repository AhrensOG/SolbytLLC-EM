"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { ArrowDown, Loader2 } from "lucide-react";

const THRESHOLD = 70;
const MAX_DISTANCE = 110;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mutate } = useSWRConfig();
  const router = useRouter();

  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const stateRef = useRef({ active: false, startY: 0, distance: 0, running: false });
  const distanceRef = useRef(0);

  async function triggerRefresh() {
    const state = stateRef.current;
    if (state.running) return;
    state.running = true;
    setRefreshing(true);
    setDistance(80);
    try {
      await Promise.all([
        mutate(() => true, undefined, { revalidate: true }),
        router.refresh(),
      ]);
    } finally {
      state.running = false;
      setRefreshing(false);
      setDistance(0);
      distanceRef.current = 0;
    }
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof window !== "undefined" && !window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const state = stateRef.current;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0) {
        state.active = true;
        state.startY = e.touches[0].clientY;
      } else {
        state.active = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!state.active || window.scrollY > 0) return;
      const delta = e.touches[0].clientY - state.startY;
      if (delta <= 0) {
        distanceRef.current = 0;
        setDistance(0);
        return;
      }
      e.preventDefault();
      const next = Math.min(delta * 0.5, MAX_DISTANCE);
      distanceRef.current = next;
      setDistance(next);
    };

    const onTouchEnd = () => {
      if (!state.active) return;
      state.active = false;
      if (distanceRef.current >= THRESHOLD) {
        triggerRefresh();
      } else {
        distanceRef.current = 0;
        setDistance(0);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ready = distance >= THRESHOLD || refreshing;

  return (
    <div ref={containerRef} className="min-h-full">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center">
        <div
          className="mt-3 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground shadow-lg"
          style={{
            opacity: distance > 0 ? Math.min(distance / 60, 1) : 0,
            transform: `translateY(${distance > 0 ? distance : -30}px)`,
            transition: refreshing ? "none" : "transform 0.2s ease, opacity 0.2s ease",
          }}
        >
          {refreshing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Actualizando…
            </>
          ) : ready ? (
            <>
              <ArrowDown className="h-3.5 w-3.5" />
              Suelta para actualizar
            </>
          ) : (
            <>
              <ArrowDown
                className="h-3.5 w-3.5"
                style={{ transform: `rotate(${Math.min(distance, 60)}deg)` }}
              />
              Desliza para actualizar
            </>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}