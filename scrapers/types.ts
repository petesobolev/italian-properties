/**
 * Scraper Type Definitions
 *
 * Defines the interface that all scrapers must implement.
 * This allows for a consistent API across different real estate agencies
 * while accommodating their unique HTML structures.
 *
 * Architecture notes:
 * - Each scraper is responsible for a single source (agency website)
 * - Scrapers may cover one or more regions
 * - The interface is async to support network operations
 */

import { PropertyInsert } from "@/types";

/**
 * Configuration for a scraper source
 */
export interface ScraperSourceConfig {
  /** Unique identifier for this source (used in database) */
  id: string;

  /** Human-readable name of the agency */
  name: string;

  /** Base URL of the agency website */
  baseUrl: string;

  /** Region slugs this source covers */
  regions: string[];

  /** Whether this source is currently active for scraping */
  isActive: boolean;

  /** Optional: Maximum pages to scrape per run */
  maxPages?: number;

  /** Optional: Delay between requests in milliseconds */
  requestDelayMs?: number;
}

/**
 * Result from a single scraper run
 */
export interface ScraperResult {
  /** Source that was scraped */
  sourceId: string;
  sourceName: string;

  /** Region that was scraped */
  regionSlug: string;

  /** Properties extracted (before database insertion) */
  properties: PropertyInsert[];

  /** Timing information */
  startedAt: Date;
  completedAt: Date;
  durationMs: number;

  /** Any errors encountered */
  errors: string[];
}

/**
 * Interface that all scrapers must implement
 */
export interface Scraper {
  /** Source configuration */
  readonly config: ScraperSourceConfig;

  /**
   * Scrape properties for a specific region
   *
   * @param regionId - Database UUID of the region
   * @param sourceId - Database UUID of the source
   * @param regionSlug - Region slug for logging
   * @returns Array of normalized property data
   */
  scrape(
    regionId: string,
    sourceId: string,
    regionSlug: string
  ): Promise<PropertyInsert[]>;
}

/**
 * Factory function type for creating scrapers
 */
export type ScraperFactory = () => Scraper;

/**
 * Registry of all available scrapers
 */
export interface ScraperRegistry {
  [sourceId: string]: ScraperFactory;
}

/**
 * Options for running the ingestion
 */
export interface IngestionOptions {
  /** Only run scrapers for these regions (empty = all) */
  regions?: string[];

  /** Only run these specific scrapers by source ID (empty = all active) */
  sources?: string[];

  /** Override max pages for all scrapers */
  maxPages?: number;

  /** Dry run - scrape but don't insert into database */
  dryRun?: boolean;

  /** Verbose logging */
  verbose?: boolean;
}

/**
 * Summary of a complete ingestion run
 */
export interface IngestionSummary {
  /** When the ingestion started */
  startedAt: Date;

  /** When the ingestion completed */
  completedAt: Date;

  /** Total duration in milliseconds */
  durationMs: number;

  /** Results from each scraper/region combination */
  results: ScraperResult[];

  /** Aggregated statistics */
  stats: {
    totalSources: number;
    totalRegions: number;
    totalPropertiesScraped: number;
    totalNewListings: number;
    totalUpdatedListings: number;
    totalErrors: number;
  };
}
