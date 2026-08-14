"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "flex h-10 w-full appearance-none rounded-lg border border-input bg-card px-3 pr-9 py-2 text-sm text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive",
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
