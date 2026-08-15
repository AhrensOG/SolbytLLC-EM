"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ArrowLeftRight,
  Tag,
  Users,
  Target,
  Repeat,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface TeamTabsProps {
  teamId: string;
}

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function TeamTabs({ teamId }: TeamTabsProps) {
  const pathname = usePathname();

  const tabs: Tab[] = [
    { href: `/teams/${teamId}`, label: "Resumen", icon: BarChart3 },
    { href: `/teams/${teamId}/transactions`, label: "Movimientos", icon: ArrowLeftRight },
    { href: `/teams/${teamId}/categories`, label: "Categorías", icon: Tag },
    { href: `/teams/${teamId}/members`, label: "Miembros", icon: Users },
    { href: `/teams/${teamId}/goal`, label: "Meta", icon: Target },
    { href: `/teams/${teamId}/recurring`, label: "Recurrentes", icon: Repeat },
    { href: `/teams/${teamId}/settings`, label: "Ajustes", icon: Settings },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors active:scale-95 active:bg-muted",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
