/**
 * Admin Portal Helper Functions
 *
 * Server-side functions for admin portal operations.
 * Handles token validation, property CRUD with ownership checks.
 */

import { Source, AdminProperty, AdminPropertyFormData, PropertyType, SaleStatus } from "@/types";

/**
 * Check if database is available
 */
function isDatabaseAvailable(): boolean {
  return !!process.env.DATABASE_URL;
}

/**
 * Lazy import of database functions
 */
async function getDb() {
  if (!isDatabaseAvailable()) return null;
  return await import("@/db");
}

/**
 * Validate an admin token and return the associated source
 * Returns null if token is invalid or not found
 */
export async function validateToken(token: string): Promise<Source | null> {
  if (!token || token.length < 32) {
    return null;
  }

  const db = await getDb();
  if (!db) return null;

  try {
    const source = await db.queryOne<Source>(
      `SELECT id, name, base_url, is_active, admin_token, logo_url, created_at
       FROM sources
       WHERE admin_token = $1`,
      [token]
    );
    return source;
  } catch (error) {
    console.error("Error validating token:", error);
    return null;
  }
}

/**
 * Get all properties for a source (for admin dashboard)
 * Returns properties with admin-relevant fields
 */
export async function getPropertiesBySource(sourceId: string): Promise<AdminProperty[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const results = await db.queryAll<{
      id: string;
      region_slug: string;
      city: string;
      address: string | null;
      price_eur: number;
      bedrooms: number | null;
      bathrooms: number | null;
      living_area_sqm: number | null;
      property_type: PropertyType;
      description_it: string | null;
      description_en: string | null;
      image_urls: string[];
      sale_status: SaleStatus;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT
        p.id,
        r.slug as region_slug,
        p.city,
        p.address,
        p.price_eur,
        p.bedrooms,
        p.bathrooms,
        p.living_area_sqm,
        p.property_type,
        p.description_it,
        p.description_en,
        p.image_urls,
        p.sale_status,
        p.created_at,
        p.updated_at
      FROM properties p
      JOIN regions r ON p.region_id = r.id
      WHERE p.source_id = $1
        AND (p.is_archived = false OR p.is_archived IS NULL)
      ORDER BY p.updated_at DESC`,
      [sourceId]
    );

    return results.map((row) => ({
      id: row.id,
      region_slug: row.region_slug,
      city: row.city,
      address: row.address || "",
      price_eur: row.price_eur,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      living_area_sqm: row.living_area_sqm,
      property_type: row.property_type,
      description_it: row.description_it || "",
      description_en: row.description_en,
      image_urls: row.image_urls || [],
      sale_status: row.sale_status || "available",
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (error) {
    console.error("Error fetching properties by source:", error);
    return [];
  }
}

/**
 * Get a single property by ID (for edit form)
 * Verifies ownership before returning
 */
export async function getPropertyByIdForSource(
  propertyId: string,
  sourceId: string
): Promise<AdminProperty | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.queryOne<{
      id: string;
      region_slug: string;
      city: string;
      address: string | null;
      price_eur: number;
      bedrooms: number | null;
      bathrooms: number | null;
      living_area_sqm: number | null;
      property_type: PropertyType;
      description_it: string | null;
      description_en: string | null;
      image_urls: string[];
      sale_status: SaleStatus;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT
        p.id,
        r.slug as region_slug,
        p.city,
        p.address,
        p.price_eur,
        p.bedrooms,
        p.bathrooms,
        p.living_area_sqm,
        p.property_type,
        p.description_it,
        p.description_en,
        p.image_urls,
        p.sale_status,
        p.created_at,
        p.updated_at
      FROM properties p
      JOIN regions r ON p.region_id = r.id
      WHERE p.id = $1 AND p.source_id = $2`,
      [propertyId, sourceId]
    );

    if (!result) return null;

    return {
      id: result.id,
      region_slug: result.region_slug,
      city: result.city,
      address: result.address || "",
      price_eur: result.price_eur,
      bedrooms: result.bedrooms,
      bathrooms: result.bathrooms,
      living_area_sqm: result.living_area_sqm,
      property_type: result.property_type,
      description_it: result.description_it || "",
      description_en: result.description_en,
      image_urls: result.image_urls || [],
      sale_status: result.sale_status || "available",
      created_at: result.created_at,
      updated_at: result.updated_at,
    };
  } catch (error) {
    console.error("Error fetching property:", error);
    return null;
  }
}

/**
 * Create a new property for a source
 * Returns the created property ID
 */
export async function createProperty(
  sourceId: string,
  data: AdminPropertyFormData,
  descriptionEn: string | null
): Promise<{ id: string } | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Get region ID from slug
    const region = await db.queryOne<{ id: string }>(
      `SELECT id FROM regions WHERE slug = $1`,
      [data.region_slug]
    );

    if (!region) {
      console.error("Region not found:", data.region_slug);
      return null;
    }

    // Generate a unique listing URL for admin-created properties
    const listingUrl = `admin://${sourceId}/${Date.now()}`;

    const result = await db.queryOne<{ id: string }>(
      `INSERT INTO properties (
        region_id,
        source_id,
        city,
        address,
        price_eur,
        bedrooms,
        bathrooms,
        living_area_sqm,
        property_type,
        description_it,
        description_en,
        image_urls,
        sale_status,
        listing_url,
        last_seen_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      RETURNING id`,
      [
        region.id,
        sourceId,
        data.city,
        data.address || null,
        data.price_eur,
        data.bedrooms,
        data.bathrooms,
        data.living_area_sqm,
        data.property_type,
        data.description_it || null,
        descriptionEn,
        JSON.stringify(data.image_urls || []),
        data.sale_status || "available",
        listingUrl,
      ]
    );

    return result;
  } catch (error) {
    console.error("Error creating property:", error);
    return null;
  }
}

/**
 * Update an existing property
 * Verifies ownership before updating
 */
export async function updateProperty(
  propertyId: string,
  sourceId: string,
  data: Partial<AdminPropertyFormData>,
  descriptionEn?: string | null
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Build dynamic update query
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Handle region update if provided
    if (data.region_slug) {
      const region = await db.queryOne<{ id: string }>(
        `SELECT id FROM regions WHERE slug = $1`,
        [data.region_slug]
      );
      if (region) {
        updates.push(`region_id = $${paramIndex}`);
        params.push(region.id);
        paramIndex++;
      }
    }

    const fields: (keyof AdminPropertyFormData)[] = [
      "city",
      "address",
      "price_eur",
      "bedrooms",
      "bathrooms",
      "living_area_sqm",
      "property_type",
      "description_it",
      "sale_status",
    ];

    for (const field of fields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        params.push(data[field]);
        paramIndex++;
      }
    }

    // Handle image_urls separately (needs JSON serialization)
    if (data.image_urls !== undefined) {
      updates.push(`image_urls = $${paramIndex}`);
      params.push(JSON.stringify(data.image_urls));
      paramIndex++;
    }

    // Handle English description
    if (descriptionEn !== undefined) {
      updates.push(`description_en = $${paramIndex}`);
      params.push(descriptionEn);
      paramIndex++;
    }

    // Always update updated_at
    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      // Only updated_at, nothing to do
      return true;
    }

    // Add property ID and source ID for WHERE clause
    params.push(propertyId, sourceId);

    const result = await db.query(
      `UPDATE properties
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex} AND source_id = $${paramIndex + 1}`,
      params
    );

    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error("Error updating property:", error);
    return false;
  }
}

/**
 * Delete a property
 * Verifies ownership before deleting
 */
export async function deleteProperty(
  propertyId: string,
  sourceId: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const result = await db.query(
      `DELETE FROM properties WHERE id = $1 AND source_id = $2`,
      [propertyId, sourceId]
    );

    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error("Error deleting property:", error);
    return false;
  }
}

/**
 * Get all regions for dropdown
 */
export async function getRegions(): Promise<Array<{ slug: string; name: string }>> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.queryAll<{ slug: string; name: string }>(
      `SELECT slug, name FROM regions ORDER BY name`
    );
  } catch (error) {
    console.error("Error fetching regions:", error);
    return [];
  }
}

/**
 * Update source logo URL
 */
export async function updateSourceLogo(
  sourceId: string,
  logoUrl: string | null
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const result = await db.query(
      `UPDATE sources SET logo_url = $1 WHERE id = $2`,
      [logoUrl, sourceId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error("Error updating source logo:", error);
    return false;
  }
}
