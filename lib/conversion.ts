import { Currency } from "@/lib/models";

export async function computeConvertedAmount(
  amount: number,
  currencyId: string,
): Promise<number> {
  const currency = await Currency.findByPk(currencyId);
  const rate = currency ? Number(currency.exchangeRateToBase) : 1;
  return Math.round(amount * rate * 100) / 100;
}

export async function getDisplayCurrencyInfo(code: string | null | undefined) {
  const requested = code
    ? await Currency.findOne({ where: { code: code.toUpperCase() } })
    : null;
  const currency =
    requested ?? (await Currency.findOne({ where: { code: "USD" } }));

  const rate = currency ? Number(currency.exchangeRateToBase) : 1;
  return {
    rate,
    code: currency?.code ?? "USD",
    symbol: currency?.symbol ?? "$",
  };
}

export function toDisplay(baseAmount: number, displayRate: number): number {
  return Math.round((baseAmount / displayRate) * 100) / 100;
}
