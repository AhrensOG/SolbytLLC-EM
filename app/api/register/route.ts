import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validation";
import { Category, Currency, Invitation, TeamMember, User } from "@/lib/models";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";
import { error, handleApiError, json } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        422,
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return error("Ya existe una cuenta con ese email", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const defaultCurrency = await Currency.findOne({ where: { code: "USD" } });

    const user = await User.create({
      name,
      email,
      passwordHash,
      defaultCurrencyId: defaultCurrency?.id ?? null,
    });

    await Category.bulkCreate(
      DEFAULT_CATEGORIES.map((c) => ({
        name: c.name,
        type: c.type,
        color: c.color,
        icon: c.icon,
        userId: user.id,
      })),
    );

    // Auto-accept pending invitations sent to this email.
    const pendingInvitations = await Invitation.findAll({
      where: { inviteeEmail: user.email, status: "pending" },
    });

    for (const invitation of pendingInvitations) {
      const existing = await TeamMember.findOne({
        where: { teamId: invitation.teamId, userId: user.id },
      });
      if (!existing) {
        await TeamMember.create({
          teamId: invitation.teamId,
          userId: user.id,
          role: "member",
        });
      }
      await invitation.update({ status: "accepted" });
    }

    return json({ id: user.id, name: user.name, email: user.email }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
