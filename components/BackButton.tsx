"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  const [fallback] = useState(() => typeof window !== "undefined" && window.history.length > 1);

  return (
    <button
      type="button"
      onClick={() => (fallback ? router.back() : router.replace("/login"))}
      aria-label="Volver"
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver
    </button>
  );
}