import { Category } from "@/lib/models";
import type { TransactionType } from "@/types";

export async function resolvePersonalCategory(
  userId: string,
  teamCategoryId: string,
): Promise<string | null> {
  const teamCategory = await Category.findByPk(teamCategoryId);
  if (!teamCategory) return null;

  const byName = await Category.findOne({
    where: { userId, teamId: null, name: teamCategory.name, type: teamCategory.type },
  });
  if (byName) return byName.id;

  const fallback = await Category.findOne({
    where: { userId, teamId: null, type: teamCategory.type as TransactionType },
    order: [["createdAt", "ASC"]],
  });
  return fallback?.id ?? null;
}