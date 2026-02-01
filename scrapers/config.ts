/**
 * Scraper Configuration
 *
 * Central configuration for all property sources.
 * Each source defines which regions it covers and scraping parameters.
 *
 * Architecture notes:
 * - Sources are keyed by a unique ID for easy lookup
 * - A source can cover multiple regions (e.g., a national agency)
 * - Configuration is separate from implementation for flexibility
 */

import { ScraperSourceConfig } from "./types";

/**
 * All configured property sources
 *
 * To add a new source:
 * 1. Add its configuration here
 * 2. Create a scraper implementation in scrapers/sources/
 * 3. Register it in the scraper registry (scrapers/registry.ts)
 */
export const SOURCES: Record<string, ScraperSourceConfig> = {
  // =========================================================================
  // TUSCANY SOURCES
  // =========================================================================

  vittori: {
    id: "vittori",
    name: "Vittori Servizi Immobiliari",
    baseUrl: "https://www.vittoriserviziimmobiliari.it",
    regions: ["tuscany"],
    isActive: true,
    maxPages: 20,
    requestDelayMs: 1000,
  },

  // Placeholder for future Tuscany sources
  // "tuscany-homes": {
  //   id: "tuscany-homes",
  //   name: "Tuscany Homes",
  //   baseUrl: "https://example.com",
  //   regions: ["tuscany"],
  //   isActive: false,
  //   maxPages: 10,
  // },

  // =========================================================================
  // CALABRIA SOURCES
  // =========================================================================

  // Placeholder for Calabria sources
  // "calabria-immobiliare": {
  //   id: "calabria-immobiliare",
  //   name: "Calabria Immobiliare",
  //   baseUrl: "https://example.com",
  //   regions: ["calabria"],
  //   isActive: false,
  //   maxPages: 10,
  // },

  // =========================================================================
  // PUGLIA SOURCES
  // =========================================================================

  // Placeholder for Puglia sources
  // "puglia-case": {
  //   id: "puglia-case",
  //   name: "Puglia Case",
  //   baseUrl: "https://example.com",
  //   regions: ["puglia"],
  //   isActive: false,
  //   maxPages: 10,
  // },

  // =========================================================================
  // MULTI-REGION SOURCES
  // =========================================================================

  // Some agencies cover multiple regions
  // "italy-sothebys": {
  //   id: "italy-sothebys",
  //   name: "Italy Sotheby's International Realty",
  //   baseUrl: "https://example.com",
  //   regions: ["tuscany", "puglia", "calabria"],
  //   isActive: false,
  //   maxPages: 15,
  // },
};

/**
 * Get all active sources
 */
export function getActiveSources(): ScraperSourceConfig[] {
  return Object.values(SOURCES).filter((s) => s.isActive);
}

/**
 * Get sources for a specific region
 */
export function getSourcesForRegion(regionSlug: string): ScraperSourceConfig[] {
  return Object.values(SOURCES).filter(
    (s) => s.isActive && s.regions.includes(regionSlug)
  );
}

/**
 * Get a source by its ID
 */
export function getSourceById(sourceId: string): ScraperSourceConfig | undefined {
  return SOURCES[sourceId];
}

/**
 * Get all unique regions covered by active sources
 */
export function getActiveRegions(): string[] {
  const regions = new Set<string>();
  for (const source of getActiveSources()) {
    for (const region of source.regions) {
      regions.add(region);
    }
  }
  return Array.from(regions);
}

/**
 * Default scraping options
 */
export const DEFAULT_OPTIONS = {
  requestDelayMs: 1000,
  maxPages: 10,
  verbose: false,
  dryRun: false,
};
