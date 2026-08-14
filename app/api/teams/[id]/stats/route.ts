import { NextRequest } from "next/server";
import { Op } from "sequelize";
import { requireMembership } from "@/lib/auth-helpers";
import { Category, Transaction, User } from "@/lib/models";
import { getDisplayCurrencyInfo, toDisplay } from "@/lib/conversion";
import { buildMonthWindows, buildMonthlySeries } from "@/lib/month-series";
import { handleApiError, json } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

function monthBounds(month: string | null) {
  const now = new Date();
  const [year, mon] =
    month && /^\d{4}-\d{2}$/.test(month)
      ? month.split("-").map(Number)
      : [now.getFullYear(), now.getMonth() + 1];
  const start = `${year}-${String(mon).padStart(2, "0")}-01`;
  const next = new Date(year, mon, 1);
  const end = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
  return { start, end };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await requireMembership(id);

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const currencyCode = searchParams.get("currency");

    const display = await getDisplayCurrencyInfo(currencyCode);
    const { start, end } = monthBounds(month);
    const monthRange = { [Op.gte]: start, [Op.lt]: end };

    const [totalIncome, totalExpense, monthlyIncome, monthlyExpense] =
      await Promise.all([
        Transaction.sum("convertedAmount", { where: { teamId: id, type: "income" } }),
        Transaction.sum("convertedAmount", { where: { teamId: id, type: "expense" } }),
        Transaction.sum("convertedAmount", {
          where: { teamId: id, type: "income", date: monthRange },
        }),
        Transaction.sum("convertedAmount", {
          where: { teamId: id, type: "expense", date: monthRange },
        }),
      ]);

    const monthTransactions = await Transaction.findAll({
      where: { teamId: id, date: monthRange },
      include: [
        { model: Category, as: "category" },
        { model: User, as: "user" },
      ],
    });

    const byCategoryMap = new Map<
      string,
      { categoryId: string; name: string; color: string; total: number }
    >();
    const byMemberMap = new Map<
      string,
      { userId: string; name: string; income: number; expense: number }
    >();
    const incomeByCategoryMap = new Map<
      string,
      { categoryId: string; name: string; color: string; total: number }
    >();

    for (const tx of monthTransactions) {
      const converted = Number(tx.convertedAmount ?? 0);

      const cat = tx.category;
      const catKey = tx.categoryId;
      const catMap = tx.type === "expense" ? byCategoryMap : incomeByCategoryMap;
      const catEntry = catMap.get(catKey);
      if (catEntry) {
        catEntry.total += converted;
      } else {
        catMap.set(catKey, {
          categoryId: catKey,
          name: cat?.name ?? "Sin categoría",
          color: cat?.color ?? "#1f2937",
          total: converted,
        });
      }

      const user = tx.user;
      const userKey = tx.userId;
      const userEntry = byMemberMap.get(userKey);
      if (userEntry) {
        if (tx.type === "income") userEntry.income += converted;
        else userEntry.expense += converted;
      } else {
        byMemberMap.set(userKey, {
          userId: userKey,
          name: user?.name ?? "Usuario",
          income: tx.type === "income" ? converted : 0,
          expense: tx.type === "expense" ? converted : 0,
        });
      }
    }

    const byCategory = [...byCategoryMap.values()]
      .sort((a, b) => b.total - a.total)
      .map((c) => ({ ...c, total: toDisplay(c.total, display.rate) }));
    const incomeByCategory = [...incomeByCategoryMap.values()]
      .sort((a, b) => b.total - a.total)
      .map((c) => ({ ...c, total: toDisplay(c.total, display.rate) }));
    const byMember = [...byMemberMap.values()]
      .sort((a, b) => b.income + b.expense - (a.income + a.expense))
      .map((m) => ({
        ...m,
        income: toDisplay(m.income, display.rate),
        expense: toDisplay(m.expense, display.rate),
      }));

    // Serie mensual: 6 meses terminando en el mes seleccionado.
    const windows = buildMonthWindows(month, 6);
    const firstWindow = windows[0];
    const lastWindow = windows[windows.length - 1];
    const seriesTransactions = await Transaction.findAll({
      where: {
        teamId: id,
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

    return json({
      balance: toDisplay(Number(totalIncome ?? 0) - Number(totalExpense ?? 0), display.rate),
      totalIncome: toDisplay(Number(totalIncome ?? 0), display.rate),
      totalExpense: toDisplay(Number(totalExpense ?? 0), display.rate),
      monthlyIncome: toDisplay(Number(monthlyIncome ?? 0), display.rate),
      monthlyExpense: toDisplay(Number(monthlyExpense ?? 0), display.rate),
      byCategory,
      incomeByCategory,
      byMember,
      monthlySeries,
      currency: { code: display.code, symbol: display.symbol },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
