/**
 * Property Ingestion Module
 *
 * Handles the process of inserting scraped properties into the database.
 * Implements deduplication based on listing_url to prevent duplicate entries.
 *
 * Architecture notes:
 * - Uses ON CONFLICT for atomic upsert operations
 * - Updates last_seen_at for existing listings to track availability
 * - Returns statistics about new vs updated listings
 */

import { query, queryOne, queryAll } from "@/db";
import { PropertyInsert, Property, Source, Region } from "@/types";

/**
 * Result of an ingestion run
 */
export interface IngestionResult {
  source: string;
  region: string;
  totalScraped: number;
  newListings: number;
  updatedListings: number;
  errors: number;
}

/**
 * Get or create a source in the database
 */
export async function getOrCreateSource(
  name: string,
  baseUrl: string
): Promise<Source> {
  // Try to find existing source
  const existing = await queryOne<Source>(
    "SELECT * FROM sources WHERE name = $1",
    [name]
  );

  if (existing) {
    return existing;
  }

  // Create new source
  const result = await queryOne<Source>(
    `INSERT INTO sources (name, base_url, is_active)
     VALUES ($1, $2, true)
     RETURNING *`,
    [name, baseUrl]
  );

  if (!result) {
    throw new Error(`Failed to create source: ${name}`);
  }

  console.log(`Created new source: ${name}`);
  return result;
}

/**
 * Get a region by its slug
 */
export async function getRegionBySlug(slug: string): Promise<Region | null> {
  return queryOne<Region>("SELECT * FROM regions WHERE slug = $1", [slug]);
}

/**
 * Check if a listing already exists by URL
 */
async function listingExists(listingUrl: string): Promise<boolean> {
  const result = await queryOne<{ exists: boolean }>(
    "SELECT EXISTS(SELECT 1 FROM properties WHERE listing_url = $1) as exists",
    [listingUrl]
  );
  return result?.exists ?? false;
}

/**
 * Insert a new property into the database
 */
async function insertProperty(property: PropertyInsert): Promise<Property | null> {
  try {
    const result = await queryOne<Property>(
      `INSERT INTO properties (
        region_id, source_id, city, price_eur, bedrooms, bathrooms,
        living_area_sqm, property_type, image_urls, description_it, description_en,
        listing_url, has_garden, has_terrace, has_balcony, has_parking, has_garage,
        source_updated_at, last_seen_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP)
      ON CONFLICT (listing_url) DO UPDATE SET
        price_eur = EXCLUDED.price_eur,
        bedrooms = COALESCE(EXCLUDED.bedrooms, properties.bedrooms),
        bathrooms = COALESCE(EXCLUDED.bathrooms, properties.bathrooms),
        living_area_sqm = COALESCE(EXCLUDED.living_area_sqm, properties.living_area_sqm),
        image_urls = EXCLUDED.image_urls,
        description_it = EXCLUDED.description_it,
        description_en = COALESCE(EXCLUDED.description_en, properties.description_en),
        has_garden = COALESCE(EXCLUDED.has_garden, properties.has_garden),
        has_terrace = COALESCE(EXCLUDED.has_terrace, properties.has_terrace),
        has_balcony = COALESCE(EXCLUDED.has_balcony, properties.has_balcony),
        has_parking = COALESCE(EXCLUDED.has_parking, properties.has_parking),
        has_garage = COALESCE(EXCLUDED.has_garage, properties.has_garage),
        source_updated_at = COALESCE(EXCLUDED.source_updated_at, properties.source_updated_at),
        last_seen_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        property.region_id,
        property.source_id,
        property.city,
        property.price_eur,
        property.bedrooms,
        property.bathrooms,
        property.living_area_sqm,
        property.property_type,
        JSON.stringify(property.image_urls || []),
        property.description_it,
        property.description_en || null,
        property.listing_url,
        property.has_garden ?? null,
        property.has_terrace ?? null,
        property.has_balcony ?? null,
        property.has_parking ?? null,
        property.has_garage ?? null,
        property.source_updated_at || null,
      ]
    );
    return result;
  } catch (error) {
    console.error(`Error inserting property ${property.listing_url}:`, error);
    return null;
  }
}

/**
 * Ingest a batch of properties into the database
 *
 * @param properties - Array of normalized property data
 * @param sourceName - Name of the source for logging
 * @param regionSlug - Slug of the region for logging
 * @returns Ingestion statistics
 */
export async function ingestProperties(
  properties: PropertyInsert[],
  sourceName: string,
  regionSlug: string
): Promise<IngestionResult> {
  const result: IngestionResult = {
    source: sourceName,
    region: regionSlug,
    totalScraped: properties.length,
    newListings: 0,
    updatedListings: 0,
    errors: 0,
  };

  for (const property of properties) {
    // Check if listing already exists
    const exists = await listingExists(property.listing_url);

    // Insert or update the property
    const inserted = await insertProperty(property);

    if (inserted) {
      if (exists) {
        result.updatedListings++;
      } else {
        result.newListings++;
      }
    } else {
      result.errors++;
    }
  }

  return result;
}

/**
 * Get all existing listing URLs for a source
 * Useful for checking what's already in the database
 */
export async function getExistingUrls(sourceId: string): Promise<Set<string>> {
  const results = await queryAll<{ listing_url: string }>(
    "SELECT listing_url FROM properties WHERE source_id = $1",
    [sourceId]
  );
  return new Set(results.map((r) => r.listing_url));
}
