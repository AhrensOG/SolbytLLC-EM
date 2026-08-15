"use client";

import { useLinkStatus } from "next/link";
import { cn } from "@/lib/cn";

export function NavLinkPending() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn("nav-link-pending", pending && "is-pending")}
    />
  );
}
