"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/cn";

export function SplashScreen() {
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 300);
    const unmountTimer = setTimeout(() => setGone(true), 700);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "splash-critical fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-300 md:hidden",
        fading && "pointer-events-none opacity-0",
      )}
    >
      <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Wallet className="h-8 w-8" />
      </div>
    </div>
  );
}
