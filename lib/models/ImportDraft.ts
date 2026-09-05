import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../db";

export class ImportDraft extends Model<
  InferAttributes<ImportDraft>,
  InferCreationAttributes<ImportDraft>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare connectionId: CreationOptional<string | null>;
  declare accountExternalId: string;
  declare transactionExternalId: string;
  declare bookingDate: string;
  declare amount: number;
  declare currencyCode: string;
  declare description: CreationOptional<string>;
  declare counterpartyName: CreationOptional<string | null>;
  declare categoryId: CreationOptional<string | null>;
  declare status: CreationOptional<"pending" | "confirmed" | "rejected">;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ImportDraft.init(
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
    connectionId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    accountExternalId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    transactionExternalId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bookingDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    currencyCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
    counterpartyName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "rejected"),
      allowNull: false,
      defaultValue: "pending",
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
    modelName: "ImportDraft",
    tableName: "import_drafts",
    indexes: [
      { unique: true, fields: ["user_id", "transaction_external_id"] },
    ],
  },
);