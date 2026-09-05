import { Category, Currency, Invitation, TeamMember, User } from "@/lib/models";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";
import type { User as UserModel } from "@/lib/models/User";

interface CreateUserInput {
  name: string;
  email: string;
  passwordHash?: string | null;
  provider?: "credentials" | "google";
  providerId?: string | null;
  image?: string | null;
}

export async function createUserWithDefaults(
  input: CreateUserInput,
): Promise<UserModel> {
  const defaultCurrency = await Currency.findOne({ where: { code: "USD" } });

  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash: input.passwordHash ?? null,
    provider: input.provider ?? "credentials",
    providerId: input.providerId ?? null,
    image: input.image ?? null,
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

  return user;
}