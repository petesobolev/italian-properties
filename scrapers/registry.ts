/**
 * Scraper Registry
 *
 * Maps source IDs to their scraper factory functions.
 * This allows the central runner to dynamically instantiate scrapers
 * based on configuration.
 *
 * To add a new scraper:
 * 1. Create the scraper in scrapers/sources/
 * 2. Import and register it here
 */

import { Scraper, ScraperFactory, ScraperRegistry } from "./types";

// Import all scraper factories
import { createVittoriScraper } from "./sources/vittori";

/**
 * Registry of all available scrapers
 * Key = source ID from config, Value = factory function
 */
export const SCRAPER_REGISTRY: ScraperRegistry = {
  vittori: createVittoriScraper,

  // Add new scrapers here as they are implemented:
  // "calabria-immobiliare": createCalabriaImmobiliareScraper,
  // "puglia-case": createPugliaCaseScraper,
};

/**
 * Get a scraper instance for a given source ID
 * @throws Error if source ID is not registered
 */
export function getScraper(sourceId: string): Scraper {
  const factory = SCRAPER_REGISTRY[sourceId];

  if (!factory) {
    throw new Error(
      `No scraper registered for source ID: ${sourceId}. ` +
        `Available scrapers: ${Object.keys(SCRAPER_REGISTRY).join(", ")}`
    );
  }

  return factory();
}

/**
 * Check if a scraper is available for a source ID
 */
export function hasScraperFor(sourceId: string): boolean {
  return sourceId in SCRAPER_REGISTRY;
}

/**
 * Get all registered source IDs
 */
export function getRegisteredSourceIds(): string[] {
  return Object.keys(SCRAPER_REGISTRY);
}
