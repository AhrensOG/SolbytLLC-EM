import { preload } from "swr";
import { fetcher } from "@/lib/fetcher";
import { currentMonth } from "@/lib/format";
import type { Currency, PublicUser } from "@/types";

type CacheGet = (key: string) => { data?: unknown } | undefined;

function resolveDefaultCurrency(cacheGet: CacheGet): Currency | undefined {
  const me = cacheGet("/api/users/me")?.data as PublicUser | undefined;
  const currencies = cacheGet("/api/currencies")?.data;
  if (!me || !Array.isArray(currencies) || currencies.length === 0) {
    return undefined;
  }
  return (
    currencies.find((c) => c.id === me.defaultCurrencyId) ??
    currencies.find((c) => c.code === "USD") ??
    currencies[0]
  );
}

export function navPrefetchKeys(href: string, cacheGet?: CacheGet): string[] {
  switch (href) {
    case "/dashboard": {
      const currency = cacheGet ? resolveDefaultCurrency(cacheGet) : undefined;
      const month = currentMonth();
      const statsKey = currency
        ? `/api/stats?month=${month}&currency=${currency.code}`
        : `/api/stats?month=${month}`;
      return [
        statsKey,
        "/api/transactions",
        "/api/recurring-expenses",
        "/api/users/me",
        "/api/currencies",
      ];
    }
    case "/transactions":
      return [
        "/api/transactions",
        "/api/categories",
        "/api/users/me",
        "/api/currencies",
      ];
    case "/categories":
      return ["/api/categories"];
    case "/recurring":
      return ["/api/recurring-expenses", "/api/categories"];
    case "/teams":
      return ["/api/teams", "/api/invitations"];
    case "/bank":
      return ["/api/bank/status", "/api/users/me", "/api/currencies"];
    case "/settings":
      return ["/api/users/me", "/api/currencies"];
    default:
      return [];
  }
}

export function preloadNavData(href: string, cacheGet?: CacheGet) {
  for (const key of navPrefetchKeys(href, cacheGet)) {
    preload(key, fetcher);
  }
}

export function preloadTeamData(teamId: string, cacheGet?: CacheGet) {
  const keys = [
    `/api/teams/${teamId}`,
    `/api/teams/${teamId}/transactions`,
    `/api/teams/${teamId}/categories`,
  ];
  if (cacheGet) {
    const currency = resolveDefaultCurrency(cacheGet);
    const month = currentMonth();
    keys.push(
      `/api/teams/${teamId}/stats?month=${month}${
        currency ? `&currency=${currency.code}` : ""
      }`,
    );
  }
  for (const key of keys) {
    preload(key, fetcher);
  }
}

export function preloadBankDetail(connectionId: string) {
  preload("/api/bank/status", fetcher);
  preload(`/api/bank/drafts?connectionId=${connectionId}`, fetcher);
}
