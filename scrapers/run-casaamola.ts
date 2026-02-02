/**
 * Manual Trigger Script for Casa Amola Scraper
 *
 * Run this script to manually ingest properties from Casa Amola (Puglia).
 * Usage: npm run scrape:casaamola
 *
 * Prerequisites:
 * 1. Database must be set up (run npm run db:setup first)
 * 2. .env.local must have DATABASE_URL configured
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { runSourceIngestion } from "./runner";
import { closePool } from "@/db";

async function main() {
  try {
    const summary = await runSourceIngestion("casaamola");

    if (summary.stats.totalErrors > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
