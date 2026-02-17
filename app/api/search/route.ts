/**
 * Natural Language Property Search API
 *
 * Parses freeform text queries using Claude AI and returns matching properties.
 * Example: "2 bedroom, 1 bath, under 70,000 with a sea view"
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Lazy import of database functions
 */
async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  return await import("@/db");
}

// Initialize Anthropic client
const anthropic = new Anthropic();

// Define the structure we want Claude to extract
interface ParsedFilters {
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  propertyTypes?: string[];
  hasSeaView?: boolean;
  hasGarden?: boolean;
  hasPool?: boolean;
  hasTerrace?: boolean;
  hasBalcony?: boolean;
  hasParking?: boolean;
  hasGarage?: boolean;
  hasFireplace?: boolean;
  hasAirConditioning?: boolean;
  hasElevator?: boolean;
  isRenovated?: boolean;
  hasMountainView?: boolean;
  hasPanoramicView?: boolean;
  cities?: string[];
}

const SYSTEM_PROMPT = `You are a search query parser for an Italian real estate website.
Parse the user's natural language query and extract structured filters.

Return ONLY a valid JSON object with these optional fields (omit fields not mentioned):
- minBedrooms, maxBedrooms: number
- minBathrooms, maxBathrooms: number
- minPrice, maxPrice: number (in euros, convert "70k" to 70000)
- minArea, maxArea: number (in square meters)
- propertyTypes: array of "apartment" | "villa" | "farmhouse" | "townhouse" | "penthouse" | "land" | "commercial"
- hasSeaView, hasGarden, hasPool, hasTerrace, hasBalcony, hasParking, hasGarage, hasFireplace, hasAirConditioning, hasElevator, isRenovated, hasMountainView, hasPanoramicView: boolean
- cities: array of city names mentioned

Examples:
- "2 bedroom apartment under 100k" → {"minBedrooms": 2, "maxBedrooms": 2, "maxPrice": 100000, "propertyTypes": ["apartment"]}
- "villa with pool and sea view" → {"propertyTypes": ["villa"], "hasPool": true, "hasSeaView": true}
- "cheap house near the sea" → {"maxPrice": 100000, "hasSeaView": true}
- "renovated with garden, at least 3 beds" → {"minBedrooms": 3, "isRenovated": true, "hasGarden": true}

Return ONLY the JSON object, no explanation or markdown.`;

export async function POST(request: NextRequest) {
  try {
    const { query, regionSlug } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Search service not configured" },
        { status: 503 }
      );
    }

    // Parse the query using Claude
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: query,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    // Extract the text response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response
    let filters: ParsedFilters;
    try {
      filters = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse AI response:", responseText);
      return NextResponse.json(
        { error: "Failed to understand query", filters: {}, properties: [] },
        { status: 200 }
      );
    }

    // Build the SQL query
    const conditions: string[] = [];
    const params: (string | number | boolean | string[])[] = [];
    let paramIndex = 1;

    // Region filter
    if (regionSlug) {
      conditions.push(`r.slug = $${paramIndex++}`);
      params.push(regionSlug);
    }

    // Exclude archived
    conditions.push(`(p.is_archived = false OR p.is_archived IS NULL)`);

    // Bedrooms
    if (filters.minBedrooms !== undefined) {
      conditions.push(`p.bedrooms >= $${paramIndex++}`);
      params.push(filters.minBedrooms);
    }
    if (filters.maxBedrooms !== undefined) {
      conditions.push(`p.bedrooms <= $${paramIndex++}`);
      params.push(filters.maxBedrooms);
    }

    // Bathrooms
    if (filters.minBathrooms !== undefined) {
      conditions.push(`p.bathrooms >= $${paramIndex++}`);
      params.push(filters.minBathrooms);
    }
    if (filters.maxBathrooms !== undefined) {
      conditions.push(`p.bathrooms <= $${paramIndex++}`);
      params.push(filters.maxBathrooms);
    }

    // Price
    if (filters.minPrice !== undefined) {
      conditions.push(`p.price_eur >= $${paramIndex++}`);
      params.push(filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      conditions.push(`p.price_eur <= $${paramIndex++}`);
      params.push(filters.maxPrice);
    }

    // Area
    if (filters.minArea !== undefined) {
      conditions.push(`p.living_area_sqm >= $${paramIndex++}`);
      params.push(filters.minArea);
    }
    if (filters.maxArea !== undefined) {
      conditions.push(`p.living_area_sqm <= $${paramIndex++}`);
      params.push(filters.maxArea);
    }

    // Property types
    if (filters.propertyTypes && filters.propertyTypes.length > 0) {
      conditions.push(`p.property_type = ANY($${paramIndex++}::text[])`);
      params.push(filters.propertyTypes);
    }

    // Boolean features
    const booleanFields: [keyof ParsedFilters, string][] = [
      ["hasSeaView", "has_sea_view"],
      ["hasGarden", "has_garden"],
      ["hasPool", "has_pool"],
      ["hasTerrace", "has_terrace"],
      ["hasBalcony", "has_balcony"],
      ["hasParking", "has_parking"],
      ["hasGarage", "has_garage"],
      ["hasFireplace", "has_fireplace"],
      ["hasAirConditioning", "has_air_conditioning"],
      ["hasElevator", "has_elevator"],
      ["isRenovated", "is_renovated"],
      ["hasMountainView", "has_mountain_view"],
      ["hasPanoramicView", "has_panoramic_view"],
    ];

    for (const [filterKey, dbColumn] of booleanFields) {
      if (filters[filterKey] === true) {
        conditions.push(`p.${dbColumn} = true`);
      }
    }

    // Cities
    if (filters.cities && filters.cities.length > 0) {
      const cityConditions = filters.cities.map(() => {
        return `p.city ILIKE $${paramIndex++}`;
      });
      conditions.push(`(${cityConditions.join(" OR ")})`);
      filters.cities.forEach((city) => params.push(`%${city}%`));
    }

    // Build the final query
    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT
        p.id,
        p.city,
        p.price_eur,
        p.bedrooms,
        p.bathrooms,
        p.living_area_sqm,
        p.property_type,
        p.image_urls->0 as thumbnail_url,
        p.image_urls,
        p.latitude,
        p.longitude,
        p.source_updated_at,
        p.updated_at,
        r.slug as region_slug,
        r.name as region_name
      FROM properties p
      JOIN regions r ON p.region_id = r.id
      ${whereClause}
      ORDER BY p.price_eur ASC
      LIMIT 50
    `;

    const db = await getDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    const results = await db.queryAll<{
      id: string;
      city: string;
      price_eur: number;
      bedrooms: number | null;
      bathrooms: number | null;
      living_area_sqm: number | null;
      property_type: string;
      thumbnail_url: string | null;
      image_urls: string[];
      latitude: number | null;
      longitude: number | null;
      source_updated_at: Date | null;
      updated_at: Date;
      region_slug: string;
      region_name: string;
    }>(sql, params);

    // Format the results to match PropertySummary
    const properties = results.map((row) => ({
      id: row.id,
      city: row.city,
      price_eur: row.price_eur,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      living_area_sqm: row.living_area_sqm,
      property_type: row.property_type,
      thumbnail_url: row.thumbnail_url,
      image_urls: row.image_urls || [],
      latitude: row.latitude,
      longitude: row.longitude,
      source_updated_at: row.source_updated_at,
      updated_at: row.updated_at,
      region_slug: row.region_slug,
    }));

    return NextResponse.json({
      filters,
      properties,
      count: properties.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
