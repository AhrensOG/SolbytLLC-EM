import { NextRequest } from "next/server";
import { Op } from "sequelize";
import { requireMembership, requireUserId } from "@/lib/auth-helpers";
import { Category, Currency, Transaction } from "@/lib/models";
import { serializeTransaction } from "@/lib/serialize";
import { transactionSchema } from "@/lib/validation";
import { computeConvertedAmount } from "@/lib/conversion";
import { handleApiError, json } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await requireMembership(id);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const month = searchParams.get("month");

    const where: Record<string, unknown> = { teamId: id };

    if (type === "income" || type === "expense") where.type = type;
    if (categoryId) where.categoryId = categoryId;

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, mon] = month.split("-").map(Number);
      const start = `${year}-${String(mon).padStart(2, "0")}-01`;
      const next = new Date(year, mon, 1);
      const end = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
      where.date = { [Op.gte]: start, [Op.lt]: end };
    }

    const transactions = await Transaction.findAll({
      where,
      include: [
        { model: Category, as: "category" },
        { model: Currency, as: "currency" },
      ],
      order: [
        ["date", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    return json(transactions.map(serializeTransaction));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    await requireMembership(id);

    const body = await req.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        422,
      );
    }

    const { type, amount, currencyId, description, date, categoryId } = parsed.data;

    const convertedAmount = await computeConvertedAmount(amount, currencyId);

    const transaction = await Transaction.create({
      type,
      amount,
      convertedAmount,
      currencyId,
      description,
      date,
      categoryId,
      userId,
      teamId: id,
    });

    const full = await Transaction.findByPk(transaction.id, {
      include: [
        { model: Category, as: "category" },
        { model: Currency, as: "currency" },
      ],
    });

    return json(serializeTransaction(full!), 201);
  } catch (err) {
    return handleApiError(err);
  }
}
