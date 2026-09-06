"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const THRESHOLD = 70;
const MAX_DISTANCE = 120;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mutate } = useSWRConfig();
  const router = useRouter();

  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const stateRef = useRef({
    active: false,
    dragging: false,
    startY: 0,
    distance: 0,
    running: false,
  });

  async function triggerRefresh() {
    const state = stateRef.current;
    if (state.running) return;
    state.running = true;
    setRefreshing(true);
    setDistance(72);
    try {
      await Promise.all([
        mutate(() => true, undefined, { revalidate: true }),
        router.refresh(),
      ]);
    } finally {
      state.running = false;
      state.distance = 0;
      setRefreshing(false);
      setDistance(0);
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
        state.dragging = false;
        state.startY = e.touches[0].clientY;
      } else {
        state.active = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!state.active || window.scrollY > 0 || state.running) return;
      const delta = e.touches[0].clientY - state.startY;
      if (delta <= 0) {
        state.dragging = false;
        setDragging(false);
        state.distance = 0;
        setDistance(0);
        return;
      }
      e.preventDefault();
      if (!state.dragging) {
        state.dragging = true;
        setDragging(true);
      }
      const next = Math.min(delta * 0.5, MAX_DISTANCE);
      state.distance = next;
      setDistance(next);
    };

    const onTouchEnd = () => {
      if (!state.active) return;
      state.active = false;
      setDragging(false);
      if (state.distance >= THRESHOLD) {
        triggerRefresh();
      } else {
        state.distance = 0;
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

  const translate = refreshing ? 72 : distance;

  return (
    <div ref={containerRef} className="min-h-full">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center"
        style={{
          opacity: distance > 0 || refreshing ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      >
        <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-lg">
          <Loader2 className={cn("h-5 w-5 text-primary", "animate-spin")} />
        </div>
      </div>

      <div
        className="relative z-10 min-h-[100dvh] bg-background"
        style={{
          transform: `translateY(${translate}px)`,
          transition:
            dragging || refreshing ? "none" : "transform 0.25s ease",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}