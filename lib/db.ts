import { Sequelize } from "sequelize";
import * as pg from "pg";

const databaseUrl =
  process.env.DATABASE_URL!;

let sequelize: Sequelize;

declare global {
  var __sequelize: Sequelize | undefined;
}

function createConnection(): Sequelize {
  return new Sequelize(databaseUrl, {
    dialect: "postgres",
    dialectModule: pg,
    logging: false,
    define: {
      underscored: true,
    },
  });
}

// Reuse the connection across hot reloads in development.
if (process.env.NODE_ENV === "production") {
  sequelize = createConnection();
} else {
  if (!global.__sequelize) {
    global.__sequelize = createConnection();
  }
  sequelize = global.__sequelize;
}

export { sequelize };
export default sequelize;
