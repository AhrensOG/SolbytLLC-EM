import { sequelize } from "../db";
import { User } from "./User";
import { Currency } from "./Currency";
import { Category } from "./Category";
import { Transaction } from "./Transaction";
import { Team } from "./Team";
import { TeamMember } from "./TeamMember";
import { Invitation } from "./Invitation";
import { RecurringExpense } from "./RecurringExpense";
import { RecurringExpenseTeam } from "./RecurringExpenseTeam";
import type { Model, ModelStatic } from "sequelize";

// ── Associations (centralized to avoid import cycles) ──
// Guarded: on hot reload, index.ts may re-evaluate while sibling model
// classes were not invalidated, so associations must be idempotent.

function assoc<M extends ModelStatic<Model>, T extends ModelStatic<Model>>(
  source: M,
  method: "belongsTo" | "hasMany" | "hasOne",
  target: T,
  options: { foreignKey: string; as: string },
) {
  const existing = (source as unknown as { associations?: Record<string, unknown> })
    .associations;
  if (existing && Object.prototype.hasOwnProperty.call(existing, options.as)) {
    return;
  }
  source[method](target, options);
}

assoc(Transaction, "belongsTo", Category, { foreignKey: "categoryId", as: "category" });
assoc(Transaction, "belongsTo", Currency, { foreignKey: "currencyId", as: "currency" });
assoc(Transaction, "belongsTo", User, { foreignKey: "userId", as: "user" });
assoc(Transaction, "belongsTo", Team, { foreignKey: "teamId", as: "team" });

assoc(Category, "hasMany", Transaction, { foreignKey: "categoryId", as: "transactions" });
assoc(Currency, "hasMany", Transaction, { foreignKey: "currencyId", as: "transactions" });
assoc(User, "hasMany", Transaction, { foreignKey: "userId", as: "transactions" });
assoc(Team, "hasMany", Transaction, { foreignKey: "teamId", as: "transactions" });
assoc(Team, "hasMany", Category, { foreignKey: "teamId", as: "categories" });

assoc(Team, "belongsTo", User, { foreignKey: "createdById", as: "createdBy" });

assoc(Team, "hasMany", TeamMember, { foreignKey: "teamId", as: "members" });
assoc(TeamMember, "belongsTo", Team, { foreignKey: "teamId", as: "team" });
assoc(TeamMember, "belongsTo", User, { foreignKey: "userId", as: "user" });

assoc(Team, "hasMany", Invitation, { foreignKey: "teamId", as: "invitations" });
assoc(Invitation, "belongsTo", Team, { foreignKey: "teamId", as: "team" });
assoc(Invitation, "belongsTo", User, { foreignKey: "invitedByUserId", as: "invitedBy" });

assoc(RecurringExpense, "belongsTo", User, { foreignKey: "userId", as: "user" });
assoc(RecurringExpense, "belongsTo", User, { foreignKey: "payedByUserId", as: "payedBy" });
assoc(RecurringExpense, "belongsTo", Category, { foreignKey: "categoryId", as: "category" });
assoc(RecurringExpense, "belongsTo", Currency, { foreignKey: "currencyId", as: "currency" });
assoc(RecurringExpense, "belongsTo", Team, { foreignKey: "teamId", as: "team" });
assoc(RecurringExpense, "hasMany", RecurringExpenseTeam, {
  foreignKey: "recurringExpenseId",
  as: "teams",
});
assoc(RecurringExpenseTeam, "belongsTo", RecurringExpense, {
  foreignKey: "recurringExpenseId",
  as: "recurringExpense",
});
assoc(RecurringExpenseTeam, "belongsTo", Team, { foreignKey: "teamId", as: "team" });

export {
  User,
  Currency,
  Category,
  Transaction,
  Team,
  TeamMember,
  Invitation,
  RecurringExpense,
  RecurringExpenseTeam,
};

export async function syncDatabase(opts: { alter?: boolean } = {}) {
  await sequelize.sync({ alter: opts.alter ?? false });
}

export { sequelize };
