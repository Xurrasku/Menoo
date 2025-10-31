import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/db/schema";

declare global {
  var __db__: ReturnType<typeof drizzle> | undefined;
  var __pool__: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not defined. Database client will not be initialized.");
}

export const pool = global.__pool__ ??
  (connectionString ? new Pool({ connectionString }) : undefined);

export const db = global.__db__ ??
  (pool ? drizzle(pool, { schema, logger: process.env.NODE_ENV === "development" }) : undefined);

if (!global.__pool__ && pool) {
  global.__pool__ = pool;
}

if (!global.__db__ && db) {
  global.__db__ = db;
}

