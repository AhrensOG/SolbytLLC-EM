import { NextRequest } from "next/server";
import { Op } from "sequelize";
import { getSessionUserId } from "@/lib/auth-helpers";
import { Category, Transaction } from "@/lib/models";
import { getDisplayCurrencyInfo, toDisplay } from "@/lib/conversion";
import { buildMonthWindows, buildMonthlySeries } from "@/lib/month-series";
import { handleApiError, json, unauthorized } from "@/lib/api";

function monthBounds(month: string | null) {
  const now = new Date();
  const [year, mon] = month && /^\d{4}-\d{2}$/.test(month)
    ? month.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];
  const start = `${year}-${String(mon).padStart(2, "0")}-01`;
  const next = new Date(year, mon, 1);
  const end = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
  return { start, end };
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const currencyCode = searchParams.get("currency");

    const display = await getDisplayCurrencyInfo(currencyCode);
    const { start, end } = monthBounds(month);
    const monthRange = { [Op.gte]: start, [Op.lt]: end };

    const [totalIncome, totalExpense, monthlyIncome, monthlyExpense] =
      await Promise.all([
        Transaction.sum("convertedAmount", {
          where: { userId, type: "income", teamId: null },
        }),
        Transaction.sum("convertedAmount", {
          where: { userId, type: "expense", teamId: null },
        }),
        Transaction.sum("convertedAmount", {
          where: { userId, type: "income", date: monthRange, teamId: null },
        }),
        Transaction.sum("convertedAmount", {
          where: { userId, type: "expense", date: monthRange, teamId: null },
        }),
      ]);

    const monthExpenses = await Transaction.findAll({
      where: { userId, type: "expense", date: monthRange, teamId: null },
      include: [{ model: Category, as: "category" }],
    });
    const monthIncomes = await Transaction.findAll({
      where: { userId, type: "income", date: monthRange, teamId: null },
      include: [{ model: Category, as: "category" }],
    });

    function aggregateByCategory(
      txs: (Transaction & { category?: Category | null })[],
    ) {
      const map = new Map<
        string,
        { categoryId: string; name: string; color: string; total: number }
      >();
      for (const tx of txs) {
        const cat = tx.category;
        const key = tx.categoryId;
        const existing = map.get(key);
        if (existing) {
          existing.total += Number(tx.convertedAmount ?? 0);
        } else {
          map.set(key, {
            categoryId: key,
            name: cat?.name ?? "Sin categoría",
            color: cat?.color ?? "#1f2937",
            total: Number(tx.convertedAmount ?? 0),
          });
        }
      }
      return [...map.values()]
        .sort((a, b) => b.total - a.total)
        .map((c) => ({ ...c, total: toDisplay(c.total, display.rate) }));
    }

    const byCategory = aggregateByCategory(monthExpenses);
    const incomeByCategory = aggregateByCategory(monthIncomes);

    // Serie mensual: 6 meses terminando en el mes seleccionado.
    const windows = buildMonthWindows(month, 6);
    const firstWindow = windows[0];
    const lastWindow = windows[windows.length - 1];
    const seriesTransactions = await Transaction.findAll({
      where: {
        userId,
        teamId: null,
        date: { [Op.gte]: firstWindow.start, [Op.lt]: lastWindow.end },
      },
      attributes: ["date", "type", "convertedAmount"],
    });
    const monthlySeries = buildMonthlySeries(
      windows,
      seriesTransactions.map((tx) => ({
        date: String(tx.date),
        type: tx.type,
        convertedAmount: tx.convertedAmount,
      })),
      display.rate,
    );

    const income = Number(monthlyIncome ?? 0);
    const expense = Number(monthlyExpense ?? 0);

    return json({
      balance: toDisplay(Number(totalIncome ?? 0) - Number(totalExpense ?? 0), display.rate),
      totalIncome: toDisplay(Number(totalIncome ?? 0), display.rate),
      totalExpense: toDisplay(Number(totalExpense ?? 0), display.rate),
      monthlyIncome: toDisplay(income, display.rate),
      monthlyExpense: toDisplay(expense, display.rate),
      byCategory,
      incomeByCategory,
      monthlySeries,
      currency: { code: display.code, symbol: display.symbol },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
