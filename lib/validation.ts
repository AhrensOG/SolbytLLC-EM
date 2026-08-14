import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").trim(),
  email: z.string().email("Ingresa un email válido").trim().toLowerCase(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido").trim(),
  type: z.enum(["income", "expense"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido").optional(),
  icon: z.string().nullable().optional(),
});

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  currencyId: z.string().min(1, "La moneda es requerida"),
  description: z.string().trim().optional().default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  categoryId: z.string().min(1, "La categoría es requerida"),
});

export const teamSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(60).trim(),
  description: z.string().max(200).trim().nullable().optional(),
});

export const inviteSchema = z.object({
  email: z.string().email("Ingresa un email válido").trim().toLowerCase(),
});

export const invitationActionSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

export const roleSchema = z.object({
  role: z.enum(["admin", "member"]),
});

export const teamGoalSchema = z.object({
  goalAmount: z.coerce.number().positive("El monto debe ser mayor a 0").nullable(),
  goalCurrencyId: z.string().nullable(),
});

export const memberGoalSchema = z.object({
  individualGoalAmount: z.coerce.number().positive("El monto debe ser mayor a 0").nullable(),
});

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

export const recurringExpenseSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100).trim(),
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  currencyId: z.string().min(1, "La moneda es requerida"),
  categoryId: z.string().min(1, "La categoría es requerida"),
  frequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  startDate: dateString,
  endDate: dateString.nullable().optional(),
  active: z.boolean().optional(),
  teamId: z.string().nullable().optional(),
  payedByUserId: z.string().nullable().optional(),
  teamIds: z.array(z.string()).max(50).optional().default([]),
});

export const shareTransactionsSchema = z.object({
  transactionIds: z.array(z.string()).min(1).max(100),
  teamIds: z.array(z.string()).min(1).max(50),
});

export const shareCategoriesSchema = z.object({
  categoryIds: z.array(z.string()).min(1).max(100),
  teamIds: z.array(z.string()).min(1).max(50),
});
