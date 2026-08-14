import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
} from "sequelize";
import { sequelize } from "../db";
import { Category } from "./Category";
import { Currency } from "./Currency";
import type { Team } from "./Team";
import type { User } from "./User";

export class Transaction extends Model<
  InferAttributes<Transaction>,
  InferCreationAttributes<Transaction>
> {
  declare id: CreationOptional<string>;
  declare type: "income" | "expense";
  declare amount: number;
  declare convertedAmount: CreationOptional<number>;
  declare currencyId: string;
  declare description: CreationOptional<string>;
  declare date: string;
  declare categoryId: string;
  declare userId: string;
  declare teamId: CreationOptional<string | null>;
  declare recurrenceKey: CreationOptional<string | null>;
  declare importKey: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare category?: NonAttribute<Category>;
  declare currency?: NonAttribute<Currency>;
  declare user?: NonAttribute<User>;
  declare team?: NonAttribute<Team>;
}

Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM("income", "expense"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    convertedAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    currencyId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    recurrenceKey: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    importKey: {
      type: DataTypes.STRING,
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
    modelName: "Transaction",
    tableName: "transactions",
  },
);

