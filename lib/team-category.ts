import { Category } from "@/lib/models";

export async function resolveTeamCategory(
  teamId: string,
  personalCategoryId: string,
): Promise<string | null> {
  const category = await Category.findByPk(personalCategoryId);
  if (!category) return null;

  const existing = await Category.findOne({
    where: { teamId, name: category.name, type: category.type },
  });
  if (existing) return existing.id;

  const created = await Category.create({
    name: category.name,
    type: category.type,
    color: category.color,
    icon: category.icon,
    userId: null,
    teamId,
  });
  return created.id;
}
