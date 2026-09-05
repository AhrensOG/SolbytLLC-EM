import { NextRequest } from "next/server";
import { z } from "zod";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import {
  getSessionUser,
  requireUserId,
} from "@/lib/auth-helpers";
import {
  Category,
  Invitation,
  RecurringExpense,
  RecurringExpenseTeam,
  Team,
  TeamMember,
  Transaction,
  User,
} from "@/lib/models";
import { sequelize } from "@/lib/db";
import { error, handleApiError, json, unauthorized } from "@/lib/api";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    return json({
      id: user.id,
      name: user.name,
      email: user.email,
      defaultCurrencyId: user.defaultCurrencyId,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const updateSchema = z.object({
  name: z.string().min(2).trim().optional(),
  defaultCurrencyId: z.string().nullable().optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return error("Datos inválidos", 422);
    }

    const { name, defaultCurrencyId } = parsed.data;
    await User.update(
      {
        ...(name !== undefined ? { name } : {}),
        ...(defaultCurrencyId !== undefined ? { defaultCurrencyId } : {}),
      },
      { where: { id: userId } },
    );

    const user = await User.findByPk(userId);
    return json({
      id: user?.id,
      name: user?.name,
      email: user?.email,
      defaultCurrencyId: user?.defaultCurrencyId,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const deleteSchema = z.object({
  password: z.string().optional(),
});

export async function DELETE(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const user = await User.findByPk(userId);
    if (!user) return error("Usuario no encontrado", 404);

    const body = await req.json().catch(() => ({}));
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) return error("Datos inválidos", 422);

    // Require the current password unless the account has none (OAuth-only).
    if (user.passwordHash) {
      const valid = await bcrypt.compare(parsed.data.password ?? "", user.passwordHash);
      if (!valid) return error("La contraseña no es correcta", 422);
    }

    await sequelize.transaction(async (t) => {
      // 1. Teams created by this user: transfer to another member or delete.
      const ownedTeams = await Team.findAll({ where: { createdById: userId }, transaction: t });
      for (const team of ownedTeams) {
        const otherMembers = await TeamMember.findAll({
          where: { teamId: team.id, userId: { [Op.ne]: userId } },
          order: [["createdAt", "ASC"]],
          transaction: t,
        });

        if (otherMembers.length > 0) {
          const newOwner = otherMembers[0];
          await team.update({ createdById: newOwner.userId }, { transaction: t });
          await TeamMember.update(
            { role: "admin" },
            { where: { teamId: team.id, userId: newOwner.userId }, transaction: t },
          );
        } else {
          await Transaction.destroy({ where: { teamId: team.id }, transaction: t });
          await Category.destroy({ where: { teamId: team.id }, transaction: t });
          await Invitation.destroy({ where: { teamId: team.id }, transaction: t });
          await RecurringExpenseTeam.destroy({ where: { teamId: team.id }, transaction: t });
          await TeamMember.destroy({ where: { teamId: team.id }, transaction: t });
          await team.destroy({ transaction: t });
        }
      }

      // 2. Transactions of this user (personal and team).
      await Transaction.destroy({ where: { userId }, transaction: t });

      // 3. Personal categories (team categories are kept).
      await Category.destroy({ where: { userId, teamId: null }, transaction: t });

      // 4. Memberships.
      await TeamMember.destroy({ where: { userId }, transaction: t });

      // 5. Invitations sent by this user.
      await Invitation.destroy({ where: { invitedByUserId: userId }, transaction: t });

      // 6. Recurring expenses created by this user (and their team links).
      const recurring = await RecurringExpense.findAll({ where: { userId }, transaction: t });
      const recurringIds = recurring.map((r) => r.id);
      if (recurringIds.length > 0) {
        await RecurringExpenseTeam.destroy({
          where: { recurringExpenseId: { [Op.in]: recurringIds } },
          transaction: t,
        });
      }
      await RecurringExpense.destroy({ where: { userId }, transaction: t });

      // 7. Recurring expenses created by others but paid by this user.
      await RecurringExpense.update(
        { payedByUserId: null },
        { where: { payedByUserId: userId }, transaction: t },
      );

      // 8. The user.
      await user.destroy({ transaction: t });
    });

    return json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}