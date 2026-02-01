/**
 * Scrapers Module Index
 *
 * Central export point for all scraper utilities.
 */

// Types
export * from "./types";

// Configuration
export {
  SOURCES,
  getActiveSources,
  getSourcesForRegion,
  getSourceById,
  getActiveRegions,
  DEFAULT_OPTIONS,
} from "./config";

// Registry
export {
  SCRAPER_REGISTRY,
  getScraper,
  hasScraperFor,
  getRegisteredSourceIds,
} from "./registry";

// Runner
export {
  runIngestion,
  runSourceIngestion,
  runRegionIngestion,
} from "./runner";

// Database ingestion utilities
export {
  getOrCreateSource,
  getRegionBySlug,
  ingestProperties,
  getExistingUrls,
  type IngestionResult,
} from "./ingest";

// Individual scrapers (for direct use if needed)
export { VittoriScraper, createVittoriScraper } from "./sources/vittori";
