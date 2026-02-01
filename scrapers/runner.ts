/**
 * Central Ingestion Runner
 *
 * Orchestrates the execution of multiple scrapers across regions.
 * Handles database lookups, error recovery, and result aggregation.
 *
 * Architecture notes:
 * - Runs scrapers sequentially to avoid overwhelming source websites
 * - Each source/region combination is treated as a separate job
 * - Results are aggregated into a summary for reporting
 */

import {
  IngestionOptions,
  IngestionSummary,
  ScraperResult,
  ScraperSourceConfig,
} from "./types";
import { getActiveSources, getSourceById, DEFAULT_OPTIONS } from "./config";
import { getScraper, hasScraperFor } from "./registry";
import {
  getOrCreateSource,
  getRegionBySlug,
  ingestProperties,
  IngestionResult,
} from "./ingest";
import { Region, Source, PropertyInsert } from "@/types";

/**
 * Run a single scraper for a specific region
 */
async function runScraper(
  sourceConfig: ScraperSourceConfig,
  region: Region,
  dbSource: Source,
  options: IngestionOptions
): Promise<{ scraperResult: ScraperResult; ingestionResult?: IngestionResult }> {
  const startedAt = new Date();
  const errors: string[] = [];

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Scraping: ${sourceConfig.name} → ${region.name}`);
  console.log(`${"=".repeat(60)}`);

  // Get the scraper instance
  const scraper = getScraper(sourceConfig.id);

  // Run the scraper
  let properties: PropertyInsert[] = [];
  try {
    properties = await scraper.scrape(region.id, dbSource.id, region.slug);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(`Scraper error: ${errorMsg}`);
    console.error(`Scraper failed: ${errorMsg}`);
  }

  const completedAt = new Date();
  const durationMs = completedAt.getTime() - startedAt.getTime();

  const scraperResult: ScraperResult = {
    sourceId: sourceConfig.id,
    sourceName: sourceConfig.name,
    regionSlug: region.slug,
    properties,
    startedAt,
    completedAt,
    durationMs,
    errors,
  };

  // Ingest into database (unless dry run)
  let ingestionResult: IngestionResult | undefined;
  if (!options.dryRun && properties.length > 0) {
    console.log(`\nIngesting ${properties.length} properties into database...`);
    try {
      ingestionResult = await ingestProperties(
        properties,
        sourceConfig.name,
        region.slug
      );
      console.log(`  New: ${ingestionResult.newListings}`);
      console.log(`  Updated: ${ingestionResult.updatedListings}`);
      console.log(`  Errors: ${ingestionResult.errors}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Ingestion error: ${errorMsg}`);
      console.error(`Ingestion failed: ${errorMsg}`);
    }
  } else if (options.dryRun) {
    console.log(`\n[DRY RUN] Would ingest ${properties.length} properties`);
  }

  return { scraperResult, ingestionResult };
}

/**
 * Run all configured scrapers
 */
export async function runIngestion(
  options: Partial<IngestionOptions> = {}
): Promise<IngestionSummary> {
  const opts: IngestionOptions = { ...DEFAULT_OPTIONS, ...options };
  const startedAt = new Date();

  console.log("\n" + "=".repeat(60));
  console.log("STARTING INGESTION RUN");
  console.log("=".repeat(60));
  console.log(`Time: ${startedAt.toISOString()}`);
  console.log(`Dry Run: ${opts.dryRun ? "Yes" : "No"}`);
  console.log(`Regions Filter: ${opts.regions?.join(", ") || "All"}`);
  console.log(`Sources Filter: ${opts.sources?.join(", ") || "All Active"}`);

  const results: ScraperResult[] = [];
  const stats = {
    totalSources: 0,
    totalRegions: 0,
    totalPropertiesScraped: 0,
    totalNewListings: 0,
    totalUpdatedListings: 0,
    totalErrors: 0,
  };

  // Get sources to run
  let sourcesToRun: ScraperSourceConfig[];
  if (opts.sources && opts.sources.length > 0) {
    sourcesToRun = opts.sources
      .map((id) => getSourceById(id))
      .filter((s): s is ScraperSourceConfig => s !== undefined && s.isActive);
  } else {
    sourcesToRun = getActiveSources();
  }

  // Filter to only sources that have registered scrapers
  sourcesToRun = sourcesToRun.filter((s) => {
    if (!hasScraperFor(s.id)) {
      console.warn(`Warning: No scraper implemented for ${s.name} (${s.id})`);
      return false;
    }
    return true;
  });

  console.log(`\nSources to run: ${sourcesToRun.map((s) => s.name).join(", ")}`);

  // Track unique regions processed
  const regionsProcessed = new Set<string>();

  // Run each source
  for (const sourceConfig of sourcesToRun) {
    stats.totalSources++;

    // Get or create database source record
    let dbSource: Source;
    try {
      dbSource = await getOrCreateSource(sourceConfig.name, sourceConfig.baseUrl);
    } catch (error) {
      console.error(`Failed to get/create source ${sourceConfig.name}:`, error);
      stats.totalErrors++;
      continue;
    }

    // Determine regions to scrape for this source
    let regionsToScrape = sourceConfig.regions;
    if (opts.regions && opts.regions.length > 0) {
      regionsToScrape = regionsToScrape.filter((r) => opts.regions!.includes(r));
    }

    // Run for each region
    for (const regionSlug of regionsToScrape) {
      // Get region from database
      const region = await getRegionBySlug(regionSlug);
      if (!region) {
        console.error(`Region not found in database: ${regionSlug}`);
        stats.totalErrors++;
        continue;
      }

      regionsProcessed.add(regionSlug);

      // Run the scraper
      const { scraperResult, ingestionResult } = await runScraper(
        sourceConfig,
        region,
        dbSource,
        opts
      );

      results.push(scraperResult);
      stats.totalPropertiesScraped += scraperResult.properties.length;
      stats.totalErrors += scraperResult.errors.length;

      if (ingestionResult) {
        stats.totalNewListings += ingestionResult.newListings;
        stats.totalUpdatedListings += ingestionResult.updatedListings;
        stats.totalErrors += ingestionResult.errors;
      }
    }
  }

  stats.totalRegions = regionsProcessed.size;

  const completedAt = new Date();
  const durationMs = completedAt.getTime() - startedAt.getTime();

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("INGESTION COMPLETE");
  console.log("=".repeat(60));
  console.log(`Duration: ${(durationMs / 1000).toFixed(1)}s`);
  console.log(`Sources: ${stats.totalSources}`);
  console.log(`Regions: ${stats.totalRegions}`);
  console.log(`Properties Scraped: ${stats.totalPropertiesScraped}`);
  console.log(`New Listings: ${stats.totalNewListings}`);
  console.log(`Updated Listings: ${stats.totalUpdatedListings}`);
  console.log(`Errors: ${stats.totalErrors}`);
  console.log("=".repeat(60));

  return {
    startedAt,
    completedAt,
    durationMs,
    results,
    stats,
  };
}

/**
 * Run ingestion for a specific source
 */
export async function runSourceIngestion(
  sourceId: string,
  options: Partial<IngestionOptions> = {}
): Promise<IngestionSummary> {
  return runIngestion({ ...options, sources: [sourceId] });
}

/**
 * Run ingestion for a specific region
 */
export async function runRegionIngestion(
  regionSlug: string,
  options: Partial<IngestionOptions> = {}
): Promise<IngestionSummary> {
  return runIngestion({ ...options, regions: [regionSlug] });
}
