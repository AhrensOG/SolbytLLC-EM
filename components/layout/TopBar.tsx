"use client";

import { Wallet } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wallet className="h-4 w-4" />
        </div>
        <span className="text-sm font-bold text-card-foreground">
          SolbytLLC EM
        </span>
      </div>
      <ThemeToggle />
    </header>
  );
}
