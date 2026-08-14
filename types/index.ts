export type TransactionType = "income" | "expense";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  defaultCurrencyId: string | null;
  createdAt: string;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRateToBase: number;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string | null;
  userId: string | null;
  teamId: string | null;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  convertedAmount: number;
  currencyId: string;
  description: string;
  date: string;
  categoryId: string;
  userId: string;
  teamId: string | null;
  createdAt: string;
  category?: Category;
  currency?: Currency;
}

export interface CategorySlice {
  categoryId: string;
  name: string;
  color: string;
  total: number;
}

export interface MonthSeriesPoint {
  month: string;
  income: number;
  expense: number;
}

export interface Stats {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  monthlyIncome: number;
  monthlyExpense: number;
  byCategory: CategorySlice[];
  incomeByCategory: CategorySlice[];
  monthlySeries: MonthSeriesPoint[];
  currency: { code: string; symbol: string };
}

export type TeamRole = "admin" | "member";

export interface Team {
  id: string;
  name: string;
  description: string | null;
  goalAmount: number | null;
  goalCurrencyId: string | null;
  createdById: string;
  createdAt: string;
  role?: TeamRole;
  memberCount?: number;
  progress?: number | null;
}

export interface TeamMemberInfo {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: TeamRole;
  individualGoalAmount: number | null;
  joinedAt: string;
}

export interface TeamGoalInfo {
  goalAmount: number | null;
  goalCurrencyId: string | null;
  currency: { code: string; symbol: string };
  progress: number;
  members: {
    userId: string;
    name: string;
    goalAmount: number | null;
    progress: number;
  }[];
}

export type Frequency = "weekly" | "monthly" | "quarterly" | "yearly";

export interface RecurringExpense {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  currencyId: string;
  categoryId: string;
  frequency: Frequency;
  startDate: string;
  endDate: string | null;
  active: boolean;
  teamId: string | null;
  payedByUserId: string | null;
  payedByName: string | null;
  teamIds: string[];
  createdAt: string;
  category?: Category;
  currency?: Currency;
}

export interface ShareResult {
  created: number;
  skipped: number;
}

export interface Invitation {
  id: string;
  teamId: string;
  teamName: string;
  invitedByUserId: string;
  invitedByName: string | null;
  inviteeEmail: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface TeamStats {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  monthlyIncome: number;
  monthlyExpense: number;
  byCategory: CategorySlice[];
  incomeByCategory: CategorySlice[];
  byMember: { userId: string; name: string; income: number; expense: number }[];
  monthlySeries: MonthSeriesPoint[];
  currency: { code: string; symbol: string };
}
