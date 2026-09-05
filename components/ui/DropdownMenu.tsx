"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface DropdownMenuProps {
  trigger: (open: boolean) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "end" | "start";
  className?: string;
  triggerClassName?: string;
}

export function DropdownMenu({
  trigger,
  children,
  align = "end",
  className,
  triggerClassName,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative" data-open={open}>
      <div
        className={cn("inline-flex", triggerClassName)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        {trigger(open)}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            className={cn(
              "absolute top-full z-50 mt-1 min-w-44 origin-top rounded-xl border border-border bg-card p-1 shadow-xl",
              align === "end" ? "right-0" : "left-0",
              className,
            )}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  danger?: boolean;
}

export function DropdownItem({ icon, danger, className, children, ...props }: DropdownItemProps) {
  return (
    <button
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-card-foreground hover:bg-muted",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}