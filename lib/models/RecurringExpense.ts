import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
} from "sequelize";
import { sequelize } from "../db";
import type { Category } from "./Category";
import type { Currency } from "./Currency";
import type { RecurringExpenseTeam } from "./RecurringExpenseTeam";
import type { User } from "./User";

export class RecurringExpense extends Model<
  InferAttributes<RecurringExpense>,
  InferCreationAttributes<RecurringExpense>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare name: string;
  declare type: "income" | "expense";
  declare amount: number;
  declare currencyId: string;
  declare categoryId: string;
  declare frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  declare startDate: string;
  declare endDate: CreationOptional<string | null>;
  declare active: CreationOptional<boolean>;
  declare teamId: CreationOptional<string | null>;
  declare payedByUserId: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare category?: NonAttribute<Category>;
  declare currency?: NonAttribute<Currency>;
  declare user?: NonAttribute<User>;
  declare payedBy?: NonAttribute<User>;
  declare teams?: NonAttribute<RecurringExpenseTeam[]>;
}

RecurringExpense.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("income", "expense"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    currencyId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    frequency: {
      type: DataTypes.ENUM("weekly", "monthly", "quarterly", "yearly"),
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    payedByUserId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "RecurringExpense",
    tableName: "recurring_expenses",
  },
);
