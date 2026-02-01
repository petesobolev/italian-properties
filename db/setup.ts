/**
 * Database Setup Script
 *
 * Run this script to initialize the database schema.
 * Usage: npx tsx db/setup.ts
 *
 * Prerequisites:
 * 1. PostgreSQL server running
 * 2. Database created (e.g., CREATE DATABASE italian_properties;)
 * 3. .env.local file with DATABASE_URL set
 */

import { readFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function setupDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("ERROR: DATABASE_URL environment variable is not set.");
    console.error("Please create a .env.local file with your database connection string.");
    console.error("Example: DATABASE_URL=postgresql://postgres:password@localhost:5432/italian_properties");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const pool = new Pool({ connectionString });

  try {
    // Test connection
    await pool.query("SELECT 1");
    console.log("Connected successfully!\n");

    // Read and execute schema
    const schemaPath = join(__dirname, "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");

    console.log("Running schema...");
    await pool.query(schema);
    console.log("Schema created successfully!\n");

    // Verify tables were created
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("Tables created:");
    tables.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    // Verify regions were seeded
    const regions = await pool.query("SELECT slug, name FROM regions ORDER BY name;");
    console.log("\nSeeded regions:");
    regions.rows.forEach((row) => {
      console.log(`  - ${row.name} (${row.slug})`);
    });

    console.log("\n✅ Database setup complete!");
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
