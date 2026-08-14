import { requireUserId } from "@/lib/auth-helpers";
import {
  RecurringExpense,
  RecurringExpenseTeam,
  TeamMember,
  Transaction,
} from "@/lib/models";
import { computeDuePeriods } from "@/lib/recurring-engine";
import { computeConvertedAmount } from "@/lib/conversion";
import { resolveTeamCategory } from "@/lib/team-category";
import { handleApiError, json } from "@/lib/api";

export async function POST() {
  try {
    const userId = await requireUserId();

    let created = 0;

    // ── Recurrentes personales (míos, compartidos opcionalmente a teams) ──
    const personalRecurring = await RecurringExpense.findAll({
      where: { userId, active: true, teamId: null },
      include: [{ model: RecurringExpenseTeam, as: "teams" }],
    });

    for (const recurring of personalRecurring) {
      const periods = computeDuePeriods({
        frequency: recurring.frequency,
        startDate: String(recurring.startDate),
        endDate: recurring.endDate ? String(recurring.endDate) : null,
      });

      for (const period of periods) {
        const personalKey = `rec:${recurring.id}:${period.period}:personal`;
        const existingPersonal = await Transaction.findOne({
          where: { recurrenceKey: personalKey },
        });
        if (!existingPersonal) {
          const convertedAmount = await computeConvertedAmount(
            Number(recurring.amount),
            recurring.currencyId,
          );
          await Transaction.create({
            type: recurring.type,
            amount: Number(recurring.amount),
            convertedAmount,
            currencyId: recurring.currencyId,
            description: recurring.name,
            date: period.date,
            categoryId: recurring.categoryId,
            userId,
            teamId: null,
            recurrenceKey: personalKey,
          });
          created++;
        }

        for (const target of recurring.teams ?? []) {
          const teamKey = `rec:${recurring.id}:${period.period}:team:${target.teamId}`;
          const existingTeam = await Transaction.findOne({
            where: { recurrenceKey: teamKey },
          });
          if (existingTeam) continue;

          const membership = await TeamMember.findOne({
            where: { teamId: target.teamId, userId },
          });
          if (!membership) continue;

          const teamCategoryId = await resolveTeamCategory(
            target.teamId,
            recurring.categoryId,
          );
          if (!teamCategoryId) continue;

          const convertedAmount = await computeConvertedAmount(
            Number(recurring.amount),
            recurring.currencyId,
          );
          await Transaction.create({
            type: recurring.type,
            amount: Number(recurring.amount),
            convertedAmount,
            currencyId: recurring.currencyId,
            description: recurring.name,
            date: period.date,
            categoryId: teamCategoryId,
            userId,
            teamId: target.teamId,
            recurrenceKey: teamKey,
          });
          created++;
        }
      }
    }

    // ── Recurrentes de los teams a los que pertenezco (atribuidos al pagador) ──
    const memberships = await TeamMember.findAll({ where: { userId } });
    const teamIds = memberships.map((m) => m.teamId);
    if (teamIds.length > 0) {
      const teamRecurring = await RecurringExpense.findAll({
        where: { teamId: teamIds, active: true },
      });

      for (const recurring of teamRecurring) {
        const periods = computeDuePeriods({
          frequency: recurring.frequency,
          startDate: String(recurring.startDate),
          endDate: recurring.endDate ? String(recurring.endDate) : null,
        });

        const payerId = recurring.payedByUserId ?? recurring.userId;

        for (const period of periods) {
          const teamKey = `rec:${recurring.id}:${period.period}:team:${recurring.teamId}`;
          const existing = await Transaction.findOne({
            where: { recurrenceKey: teamKey },
          });
          if (existing) continue;

          const convertedAmount = await computeConvertedAmount(
            Number(recurring.amount),
            recurring.currencyId,
          );
          await Transaction.create({
            type: recurring.type,
            amount: Number(recurring.amount),
            convertedAmount,
            currencyId: recurring.currencyId,
            description: recurring.name,
            date: period.date,
            categoryId: recurring.categoryId,
            userId: payerId,
            teamId: recurring.teamId,
            recurrenceKey: teamKey,
          });
          created++;
        }
      }
    }

    return json({ created });
  } catch (err) {
    return handleApiError(err);
  }
}
