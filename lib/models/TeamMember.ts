import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
} from "sequelize";
import { sequelize } from "../db";
import type { Team } from "./Team";
import type { User } from "./User";

export class TeamMember extends Model<
  InferAttributes<TeamMember>,
  InferCreationAttributes<TeamMember>
> {
  declare id: CreationOptional<string>;
  declare teamId: string;
  declare userId: string;
  declare role: "admin" | "member";
  declare individualGoalAmount: CreationOptional<number | null>;
  declare joinedAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare team?: NonAttribute<Team>;
  declare user?: NonAttribute<User>;
}

TeamMember.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "member"),
      allowNull: false,
      defaultValue: "member",
    },
    individualGoalAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    modelName: "TeamMember",
    tableName: "team_members",
    indexes: [{ unique: true, fields: ["team_id", "user_id"] }],
  },
);
