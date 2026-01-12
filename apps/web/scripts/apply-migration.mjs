#!/usr/bin/env node

/**
 * Helper script to apply the menu_views migration
 * Run with: node scripts/apply-migration.mjs
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationFile = join(__dirname, "../drizzle/0002_chunky_inertia.sql");

async function applyMigration() {
  const connectionString = process.env.DATABASE_URL || process.env.DRIZZLE_DB_URL;

  if (!connectionString) {
    console.error("❌ DATABASE_URL or DRIZZLE_DB_URL environment variable is not set");
    console.error("Please set one of these environment variables and try again.");
    process.exit(1);
  }

  try {
    const migrationSQL = readFileSync(migrationFile, "utf-8");
    console.log("📄 Reading migration file:", migrationFile);
    console.log("\n📋 Migration SQL:");
    console.log(migrationSQL);
    console.log("\n🔄 Applying migration...");

    const pool = new Pool({ connectionString });
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(migrationSQL);
      await client.query("COMMIT");
      console.log("✅ Migration applied successfully!");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error("❌ Failed to apply migration:", error.message);
    if (error.code === "42P07") {
      console.error("ℹ️  Table already exists. This is okay - migration may have already been applied.");
    } else {
      process.exit(1);
    }
  }
}

applyMigration();

