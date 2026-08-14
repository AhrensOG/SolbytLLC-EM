import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sequelize has dual CJS/ESM entry points; bundling it (Turbopack dev) can
  // produce two module copies and break `instanceof Model` checks in associations.
  serverExternalPackages: ["sequelize"],
};

export default nextConfig;
