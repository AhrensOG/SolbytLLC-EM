import { useCurrencies } from "./useCurrencies";
import { useMe } from "./useMe";
import type { Currency } from "@/types";

export function useDefaultCurrency(): Currency | undefined {
  const { data: currencies } = useCurrencies();
  const { data: me } = useMe();

  if (!currencies || !me) return undefined;

  return (
    currencies.find((c) => c.id === me.defaultCurrencyId) ??
    currencies.find((c) => c.code === "USD") ??
    currencies[0]
  );
}
