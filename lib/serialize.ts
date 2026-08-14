import type {
  Category,
  Currency,
  Invitation,
  RecurringExpense,
  Team,
  TeamMemberInfo,
  TeamRole,
  Transaction,
} from "@/types";
import type { Category as CategoryModel } from "./models/Category";
import type { Currency as CurrencyModel } from "./models/Currency";
import type { Invitation as InvitationModel } from "./models/Invitation";
import type { RecurringExpense as RecurringExpenseModel } from "./models/RecurringExpense";
import type { Team as TeamModel } from "./models/Team";
import type { TeamMember as TeamMemberModel } from "./models/TeamMember";
import type { Transaction as TransactionModel } from "./models/Transaction";

export function serializeCurrency(currency: CurrencyModel): Currency {
  return {
    id: currency.id,
    code: currency.code,
    name: currency.name,
    symbol: currency.symbol,
    exchangeRateToBase: Number(currency.exchangeRateToBase),
  };
}

export function serializeCategory(category: CategoryModel): Category {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    color: category.color,
    icon: category.icon,
    userId: category.userId,
    teamId: category.teamId,
    createdAt: category.createdAt.toISOString(),
  };
}

export function serializeTransaction(
  transaction: TransactionModel,
): Transaction {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: Number(transaction.amount),
    convertedAmount: Number(transaction.convertedAmount ?? 0),
    currencyId: transaction.currencyId,
    description: transaction.description,
    date: String(transaction.date),
    categoryId: transaction.categoryId,
    userId: transaction.userId,
    teamId: transaction.teamId,
    createdAt: transaction.createdAt.toISOString(),
    category: transaction.category
      ? serializeCategory(transaction.category)
      : undefined,
    currency: transaction.currency
      ? serializeCurrency(transaction.currency)
      : undefined,
  };
}

export function serializeTeam(
  team: TeamModel,
  opts?: { role?: TeamRole; memberCount?: number; progress?: number | null },
): Team {
  return {
    id: team.id,
    name: team.name,
    description: team.description,
    goalAmount: team.goalAmount == null ? null : Number(team.goalAmount),
    goalCurrencyId: team.goalCurrencyId,
    createdById: team.createdById,
    createdAt: team.createdAt.toISOString(),
    ...(opts?.role ? { role: opts.role } : {}),
    ...(opts?.memberCount !== undefined
      ? { memberCount: opts.memberCount }
      : {}),
    ...(opts?.progress !== undefined ? { progress: opts.progress } : {}),
  };
}

export function serializeMember(member: TeamMemberModel): TeamMemberInfo {
  return {
    id: member.id,
    userId: member.userId,
    name: member.user?.name ?? "Usuario",
    email: member.user?.email ?? "",
    role: member.role,
    individualGoalAmount:
      member.individualGoalAmount == null ? null : Number(member.individualGoalAmount),
    joinedAt: member.joinedAt.toISOString(),
  };
}

export function serializeInvitation(
  invitation: InvitationModel,
  teamName?: string,
): Invitation {
  return {
    id: invitation.id,
    teamId: invitation.teamId,
    teamName: teamName ?? invitation.team?.name ?? "Equipo",
    invitedByUserId: invitation.invitedByUserId,
    invitedByName: invitation.invitedBy?.name ?? null,
    inviteeEmail: invitation.inviteeEmail,
    status: invitation.status,
    createdAt: invitation.createdAt.toISOString(),
  };
}

export function serializeRecurringExpense(
  recurring: RecurringExpenseModel,
  teamIds: string[] = [],
): RecurringExpense {
  return {
    id: recurring.id,
    name: recurring.name,
    type: recurring.type,
    amount: Number(recurring.amount),
    currencyId: recurring.currencyId,
    categoryId: recurring.categoryId,
    frequency: recurring.frequency,
    startDate: String(recurring.startDate),
    endDate: recurring.endDate ? String(recurring.endDate) : null,
    active: recurring.active,
    teamId: recurring.teamId,
    payedByUserId: recurring.payedByUserId,
    payedByName: recurring.payedBy?.name ?? null,
    teamIds,
    createdAt: recurring.createdAt.toISOString(),
    category: recurring.category
      ? serializeCategory(recurring.category)
      : undefined,
    currency: recurring.currency
      ? serializeCurrency(recurring.currency)
      : undefined,
  };
}
