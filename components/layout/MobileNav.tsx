"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSWRConfig } from "swr";
import { NAV_ITEMS } from "./nav";
import { NavLinkPending } from "./NavLinkPending";
import { useInvitations } from "@/lib/hooks/useInvitations";
import { preloadNavData } from "@/lib/nav-prefetch";
import { cn } from "@/lib/cn";

export function MobileNav() {
  const pathname = usePathname();
  const { cache } = useSWRConfig();
  const { data: invitations } = useInvitations();
  const pendingCount =
    invitations?.filter((i) => i.status === "pending").length ?? 0;

  return (
    <nav className="no-scrollbar fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around overflow-x-auto border-t border-border bg-card px-1 py-2 md:hidden">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const showBadge = item.href === "/teams" && pendingCount > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            onPointerDown={() => preloadNavData(item.href, (k) => cache.get(k))}
            className={cn(
              "relative flex min-w-16 shrink-0 flex-col items-center justify-center gap-0.5 whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-medium transition-colors active:scale-95 active:bg-muted",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.labelShort ?? item.label}
            <NavLinkPending />
            {showBadge && (
              <span className="absolute -top-0.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-solbyt-pink-500 px-1 text-[10px] font-semibold text-white">
                {pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
