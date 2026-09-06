import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import { sequelize } from "../db";

export class BankConnection extends Model<
  InferAttributes<BankConnection>,
  InferCreationAttributes<BankConnection>
> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare provider: CreationOptional<string>;
  declare sessionId: CreationOptional<string | null>;
  declare institutionId: string;
  declare institutionName: CreationOptional<string | null>;
  declare authState: CreationOptional<string | null>;
  declare accountExternalId: CreationOptional<string | null>;
  declare accountName: CreationOptional<string | null>;
  declare accountIban: CreationOptional<string | null>;
  declare accountCurrency: CreationOptional<string | null>;
  declare status: CreationOptional<string | null>;
  declare validUntil: CreationOptional<Date | null>;
  declare lastSyncedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

BankConnection.init(
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
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "enablebanking",
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    institutionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    institutionName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    authState: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountExternalId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountIban: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accountCurrency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastSyncedAt: {
      type: DataTypes.DATE,
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
    modelName: "BankConnection",
    tableName: "bank_connections",
  },
);