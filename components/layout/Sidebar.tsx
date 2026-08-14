"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { NAV_ITEMS } from "./nav";
import { SignOutButton } from "./SignOutButton";
import { useInvitations } from "@/lib/hooks/useInvitations";
import { cn } from "@/lib/cn";

interface SidebarProps {
  userName?: string | null;
}

export function Sidebar({ userName }: SidebarProps) {
  const pathname = usePathname();
  const { data: invitations } = useInvitations();
  const pendingCount =
    invitations?.filter((i) => i.status === "pending").length ?? 0;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold text-card-foreground">
            SolbytLLC EM
          </span>
          <span className="text-xs text-muted-foreground">
            Control de gastos
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const showBadge = item.href === "/teams" && pendingCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}>
              <item.icon className="h-5 w-5" />
              {item.label}
              {showBadge && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-solbyt-pink-500 px-1.5 text-xs font-semibold text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-border p-3">
        {userName && (
          <div className="mb-1 flex items-center gap-3 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-solbyt-purple-500 text-sm font-semibold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="truncate text-sm font-medium text-card-foreground">
              {userName}
            </span>
          </div>
        )}
        <SignOutButton />
      </div>
    </aside>
  );
}
