import useSWR from "swr";
import type { Currency } from "@/types";

export function useCurrencies() {
  return useSWR<Currency[]>("/api/currencies");
}
