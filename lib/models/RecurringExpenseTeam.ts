import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../db";

export class RecurringExpenseTeam extends Model<
  InferAttributes<RecurringExpenseTeam>,
  InferCreationAttributes<RecurringExpenseTeam>
> {
  declare id: CreationOptional<string>;
  declare recurringExpenseId: string;
  declare teamId: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

RecurringExpenseTeam.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    recurringExpenseId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: false,
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
    modelName: "RecurringExpenseTeam",
    tableName: "recurring_expense_teams",
    indexes: [{ unique: true, fields: ["recurring_expense_id", "team_id"] }],
  },
);
