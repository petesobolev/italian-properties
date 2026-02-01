/**
 * Run All Scrapers
 *
 * Manual trigger to run all active scrapers across all regions.
 * Usage: npm run scrape:all
 *
 * Options can be passed via environment variables:
 * - DRY_RUN=true     - Scrape but don't insert into database
 * - REGIONS=tuscany  - Only scrape specific regions (comma-separated)
 * - SOURCES=vittori  - Only run specific scrapers (comma-separated)
 * - MAX_PAGES=5      - Override max pages per scraper
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { runIngestion } from "./runner";
import { closePool } from "@/db";
import { IngestionOptions } from "./types";

async function main() {
  // Parse options from environment
  const options: IngestionOptions = {
    dryRun: process.env.DRY_RUN === "true",
    verbose: process.env.VERBOSE === "true",
  };

  if (process.env.REGIONS) {
    options.regions = process.env.REGIONS.split(",").map((r) => r.trim());
  }

  if (process.env.SOURCES) {
    options.sources = process.env.SOURCES.split(",").map((s) => s.trim());
  }

  if (process.env.MAX_PAGES) {
    options.maxPages = parseInt(process.env.MAX_PAGES, 10);
  }

  try {
    const summary = await runIngestion(options);

    // Exit with error code if there were errors
    if (summary.stats.totalErrors > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Fatal error during ingestion:", error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
