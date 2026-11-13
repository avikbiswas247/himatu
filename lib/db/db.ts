
import { Pool, type PoolConfig } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const globalForPg = globalThis as typeof globalThis & {
  pgPool?: Pool;
};

const poolConfig: PoolConfig = {
  connectionString,

  // Keep this modest for serverless deployments.
  max: Number(process.env.PG_POOL_MAX ?? 5),

  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,

  // Release connections that are no longer healthy.
  allowExitOnIdle: true,

  ssl: {
    rejectUnauthorized: true,
  },

  application_name: "commerce-management",
};

export const pool =
  globalForPg.pgPool ?? new Pool(poolConfig);

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});
