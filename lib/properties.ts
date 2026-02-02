/**
 * Properties Data Access Layer
 *
 * Server-side functions for fetching property data from the database.
 * These functions are designed to be called from Server Components.
 *
 * Architecture notes:
 * - All queries include proper JOINs to get related data
 * - Results are typed using our database types
 * - Functions handle missing database gracefully (returns empty data)
 * - Uses dynamic imports to avoid blocking Next.js startup
 */

import { PropertySummary, PropertyWithDetails, Region, PropertyFilters } from "@/types";

/**
 * Check if database is available
 * Returns false during build or when DATABASE_URL is not set
 */
function isDatabaseAvailable(): boolean {
  return !!process.env.DATABASE_URL;
}

/**
 * Lazy import of database functions
 * This prevents blocking Next.js startup if there are connection issues
 */
async function getDb() {
  if (!isDatabaseAvailable()) return null;
  return await import("@/db");
}

/**
 * Get all properties for a region (for grid display)
 * Returns lightweight summaries optimized for the listing grid
 * Supports optional filtering by price, bedrooms, bathrooms, and property type
 */
export async function getPropertiesByRegion(
  regionSlug: string,
  filters?: PropertyFilters
): Promise<PropertySummary[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Build dynamic query with filters
    const conditions: string[] = ["r.slug = $1"];
    const params: (string | number)[] = [regionSlug];
    let paramIndex = 2;

    if (filters?.price_min !== undefined) {
      conditions.push(`p.price_eur >= $${paramIndex}`);
      params.push(filters.price_min);
      paramIndex++;
    }

    if (filters?.price_max !== undefined) {
      conditions.push(`p.price_eur <= $${paramIndex}`);
      params.push(filters.price_max);
      paramIndex++;
    }

    if (filters?.bedrooms_min !== undefined) {
      conditions.push(`p.bedrooms >= $${paramIndex}`);
      params.push(filters.bedrooms_min);
      paramIndex++;
    }

    if (filters?.bathrooms_min !== undefined) {
      conditions.push(`p.bathrooms >= $${paramIndex}`);
      params.push(filters.bathrooms_min);
      paramIndex++;
    }

    if (filters?.property_types && filters.property_types.length > 0) {
      // Support multiple property types with IN clause
      const placeholders = filters.property_types.map((_, i) => `$${paramIndex + i}`).join(", ");
      conditions.push(`p.property_type IN (${placeholders})`);
      params.push(...filters.property_types);
      paramIndex += filters.property_types.length;
    }

    if (filters?.has_sea_view === true) {
      conditions.push(`p.has_sea_view = true`);
    }

    if (filters?.has_garden === true) {
      conditions.push(`p.has_garden = true`);
    }

    // Determine sort order (default to most recently updated)
    let orderBy = "p.updated_at DESC";
    if (filters?.sort === "price_asc") {
      orderBy = "p.price_eur ASC";
    } else if (filters?.sort === "price_desc") {
      orderBy = "p.price_eur DESC";
    }

    const results = await db.queryAll<{
      id: string;
      city: string;
      price_eur: number;
      bedrooms: number | null;
      bathrooms: number | null;
      living_area_sqm: number | null;
      property_type: string;
      image_urls: string[];
      region_slug: string;
      latitude: number | null;
      longitude: number | null;
    }>(
      `SELECT
        p.id,
        p.city,
        p.price_eur,
        p.bedrooms,
        p.bathrooms,
        p.living_area_sqm,
        p.property_type,
        p.image_urls,
        p.latitude,
        p.longitude,
        r.slug as region_slug
      FROM properties p
      JOIN regions r ON p.region_id = r.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY ${orderBy}`,
      params
    );

    // Transform to PropertySummary with thumbnail extraction
    return results.map((row) => ({
      id: row.id,
      city: row.city,
      price_eur: row.price_eur,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      living_area_sqm: row.living_area_sqm,
      property_type: row.property_type as PropertySummary["property_type"],
      thumbnail_url: row.image_urls?.[0] || null,
      image_urls: row.image_urls || [],
      region_slug: row.region_slug,
      latitude: row.latitude,
      longitude: row.longitude,
    }));
  } catch (error) {
    console.error("Error fetching properties:", error);
    return [];
  }
}

/**
 * Get a single property with full details
 */
export async function getPropertyById(
  propertyId: string
): Promise<PropertyWithDetails | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.queryOne<PropertyWithDetails & { image_urls: string[] }>(
      `SELECT
        p.*,
        r.name as region_name,
        r.slug as region_slug,
        s.name as source_name,
        s.base_url as source_base_url
      FROM properties p
      JOIN regions r ON p.region_id = r.id
      JOIN sources s ON p.source_id = s.id
      WHERE p.id = $1`,
      [propertyId]
    );

    return result;
  } catch (error) {
    console.error("Error fetching property:", error);
    return null;
  }
}

/**
 * Get a region by slug
 */
export async function getRegion(slug: string): Promise<Region | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    return await db.queryOne<Region>("SELECT * FROM regions WHERE slug = $1", [slug]);
  } catch (error) {
    console.error("Error fetching region:", error);
    return null;
  }
}

/**
 * Get property count for a region
 */
export async function getPropertyCountByRegion(
  regionSlug: string
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count
      FROM properties p
      JOIN regions r ON p.region_id = r.id
      WHERE r.slug = $1`,
      [regionSlug]
    );

    return parseInt(result?.count || "0", 10);
  } catch (error) {
    console.error("Error fetching property count:", error);
    return 0;
  }
}

/**
 * Get all regions with their property counts
 * This is more efficient than calling getPropertyCountByRegion multiple times
 */
export async function getRegionsWithCounts(): Promise<
  Array<{ slug: string; name: string; count: number }>
> {
  const db = await getDb();
  if (!db) return [];

  try {
    const results = await db.queryAll<{ slug: string; name: string; count: string }>(
      `SELECT
        r.slug,
        r.name,
        COUNT(p.id) as count
      FROM regions r
      LEFT JOIN properties p ON p.region_id = r.id
      GROUP BY r.id, r.slug, r.name
      ORDER BY r.name`
    );

    return results.map((r) => ({
      slug: r.slug,
      name: r.name,
      count: parseInt(r.count, 10),
    }));
  } catch (error) {
    console.error("Error fetching regions:", error);
    return [];
  }
}
