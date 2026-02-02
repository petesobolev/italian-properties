/**
 * Property Geocoding Script
 *
 * Adds latitude/longitude coordinates to properties by geocoding their city names.
 * Uses the free OpenStreetMap Nominatim API with proper rate limiting.
 *
 * Usage: npx tsx scripts/geocode-properties.ts [--dry-run] [--limit N]
 *
 * Note: Nominatim has a 1 request/second rate limit. This script respects that limit.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { query, queryAll, closePool } from "../db/connection";

interface CityRow {
  city: string;
  region_name: string;
  property_count: number;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  type: string;
}

// Rate limiting: Nominatim requires max 1 request per second
const RATE_LIMIT_MS = 1100; // 1.1 seconds to be safe

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Geocode a city name using Nominatim
 * Returns coordinates or null if not found
 */
async function geocodeCity(
  city: string,
  region: string
): Promise<{ lat: number; lon: number } | null> {
  // Build search query with region and country for accuracy
  const searchQuery = `${city}, ${region}, Italy`;
  const encodedQuery = encodeURIComponent(searchQuery);

  const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1&countrycodes=it`;

  try {
    const response = await fetch(url, {
      headers: {
        // Nominatim requires a valid User-Agent
        "User-Agent": "ItalianPropertiesApp/1.0 (property geocoding script)",
      },
    });

    if (!response.ok) {
      console.error(`   ⚠️  HTTP ${response.status} for "${city}"`);
      return null;
    }

    const results: NominatimResult[] = await response.json();

    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
    };
  } catch (error) {
    console.error(`   ❌ Fetch error for "${city}":`, error);
    return null;
  }
}

/**
 * Update all properties in a city with coordinates
 */
async function updatePropertiesInCity(
  city: string,
  lat: number,
  lon: number
): Promise<number> {
  const result = await query(
    `UPDATE properties
     SET latitude = $1, longitude = $2, updated_at = CURRENT_TIMESTAMP
     WHERE city = $3 AND (latitude IS NULL OR longitude IS NULL)`,
    [lat, lon, city]
  );

  return result.rowCount || 0;
}

/**
 * Main geocoding function
 */
async function geocodeProperties(options: {
  dryRun: boolean;
  limit?: number;
}) {
  console.log("🌍 Starting property geocoding...\n");

  if (options.dryRun) {
    console.log("📋 DRY RUN MODE - No changes will be saved\n");
  }

  // Get unique cities that need geocoding, grouped with their region
  let sql = `
    SELECT
      p.city,
      r.name as region_name,
      COUNT(*) as property_count
    FROM properties p
    JOIN regions r ON p.region_id = r.id
    WHERE p.latitude IS NULL OR p.longitude IS NULL
    GROUP BY p.city, r.name
    ORDER BY COUNT(*) DESC
  `;

  if (options.limit) {
    sql += ` LIMIT ${options.limit}`;
  }

  const cities = await queryAll<CityRow>(sql);
  console.log(`📍 Found ${cities.length} cities to geocode\n`);

  if (cities.length === 0) {
    console.log("✅ All properties already have coordinates!");
    return;
  }

  let geocodedCount = 0;
  let failedCount = 0;
  let propertiesUpdated = 0;

  for (let i = 0; i < cities.length; i++) {
    const { city, region_name, property_count } = cities[i];

    console.log(
      `[${i + 1}/${cities.length}] 🏘️  ${city} (${region_name}) - ${property_count} properties`
    );

    // Rate limiting - wait before each request (except first)
    if (i > 0) {
      await sleep(RATE_LIMIT_MS);
    }

    const coords = await geocodeCity(city, region_name);

    if (coords) {
      console.log(`   📍 Found: ${coords.lat.toFixed(5)}, ${coords.lon.toFixed(5)}`);

      if (!options.dryRun) {
        const updated = await updatePropertiesInCity(city, coords.lat, coords.lon);
        console.log(`   ✅ Updated ${updated} properties`);
        propertiesUpdated += updated;
      } else {
        console.log(`   📋 Would update ${property_count} properties (dry run)`);
      }

      geocodedCount++;
    } else {
      console.log(`   ⚠️  Could not geocode "${city}"`);
      failedCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Geocoding Summary:");
  console.log(`   🌍 Cities geocoded: ${geocodedCount}`);
  console.log(`   ⚠️  Cities failed: ${failedCount}`);
  if (!options.dryRun) {
    console.log(`   🏠 Properties updated: ${propertiesUpdated}`);
  }
  console.log("=".repeat(50) + "\n");
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitIndex = args.indexOf("--limit");
const limit =
  limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : undefined;

// Run the geocoding
geocodeProperties({ dryRun, limit })
  .then(() => {
    console.log("✨ Geocoding complete!");
    return closePool();
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
