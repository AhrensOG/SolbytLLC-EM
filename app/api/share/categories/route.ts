import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth-helpers";
import { Category, TeamMember } from "@/lib/models";
import { shareCategoriesSchema } from "@/lib/validation";
import { error, handleApiError, json } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();

    const body = await req.json();
    const parsed = shareCategoriesSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        422,
      );
    }

    const { categoryIds, teamIds } = parsed.data;

    for (const teamId of teamIds) {
      const member = await TeamMember.findOne({ where: { teamId, userId } });
      if (!member) {
        return error("No eres miembro de uno de los equipos seleccionados", 403);
      }
    }

    const categories = await Category.findAll({
      where: { id: categoryIds, userId, teamId: null },
    });
    if (categories.length !== categoryIds.length) {
      return error("Algunas categorías no existen o no te pertenecen", 404);
    }

    let created = 0;
    let skipped = 0;

    for (const cat of categories) {
      for (const teamId of teamIds) {
        const exists = await Category.findOne({
          where: { teamId, name: cat.name, type: cat.type },
        });
        if (exists) {
          skipped++;
          continue;
        }

        await Category.create({
          name: cat.name,
          type: cat.type,
          color: cat.color,
          icon: cat.icon,
          userId: null,
          teamId,
        });
        created++;
      }
    }

    return json({ created, skipped });
  } catch (err) {
    return handleApiError(err);
  }
}
