/**
 * Database Types
 *
 * TypeScript interfaces matching the PostgreSQL schema.
 * These types ensure type safety when working with database records.
 *
 * Architecture note: We define both "row" types (what comes from the database)
 * and "insert" types (what we send to the database) to handle auto-generated
 * fields like IDs and timestamps.
 */

// ============================================================================
// REGION TYPES
// ============================================================================

/**
 * Region as stored in the database
 */
export interface Region {
  id: string;           // UUID
  slug: string;         // URL-friendly identifier (e.g., "tuscany")
  name: string;         // Display name (e.g., "Tuscany")
  created_at: Date;
}

/**
 * Data required to insert a new region
 */
export interface RegionInsert {
  slug: string;
  name: string;
}

// ============================================================================
// SOURCE TYPES
// ============================================================================

/**
 * Source (real estate agency) as stored in the database
 */
export interface Source {
  id: string;           // UUID
  name: string;         // Agency name
  base_url: string;     // Website base URL
  is_active: boolean;   // Whether to include in scraping runs
  created_at: Date;
}

/**
 * Data required to insert a new source
 */
export interface SourceInsert {
  name: string;
  base_url: string;
  is_active?: boolean;  // Defaults to true
}

// ============================================================================
// PROPERTY TYPES
// ============================================================================

/**
 * Valid property types for the application
 * Matches common Italian real estate classifications
 */
export type PropertyType =
  | "apartment"       // Appartamento
  | "villa"           // Villa
  | "farmhouse"       // Casale / Rustico
  | "townhouse"       // Casa a schiera
  | "penthouse"       // Attico
  | "studio"          // Monolocale
  | "land"            // Terreno
  | "commercial"      // Commerciale
  | "other";          // Altro

/**
 * Property listing as stored in the database
 */
export interface Property {
  id: string;                    // UUID
  region_id: string;             // FK to regions
  source_id: string;             // FK to sources
  city: string;
  price_eur: number;
  bedrooms: number | null;       // Nullable - not always available
  bathrooms: number | null;      // Nullable - not always available
  living_area_sqm: number | null; // Nullable - not always available
  property_type: PropertyType;
  image_urls: string[];          // Stored as JSONB in PostgreSQL
  description_it: string | null;
  listing_url: string;           // Unique - used for deduplication
  has_sea_view: boolean | null;  // Nullable - extracted from description
  has_garden: boolean | null;    // Nullable - extracted from description
  last_seen_at: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Data required to insert a new property
 */
export interface PropertyInsert {
  region_id: string;
  source_id: string;
  city: string;
  price_eur: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  living_area_sqm?: number | null;
  property_type: PropertyType;
  image_urls?: string[];
  description_it?: string | null;
  listing_url: string;
  has_sea_view?: boolean | null;
  has_garden?: boolean | null;
}

/**
 * Data for updating an existing property
 * All fields optional except id
 */
export interface PropertyUpdate {
  price_eur?: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  living_area_sqm?: number | null;
  property_type?: PropertyType;
  image_urls?: string[];
  description_it?: string | null;
  last_seen_at?: Date;
}

// ============================================================================
// JOINED TYPES (for queries with JOINs)
// ============================================================================

/**
 * Property with region and source information
 * Used for display in the UI
 */
export interface PropertyWithDetails extends Property {
  region_name: string;
  region_slug: string;
  source_name: string;
  source_base_url: string;
}

/**
 * Lightweight property summary for grid display
 * Omits heavy fields like description for performance
 */
export interface PropertySummary {
  id: string;
  city: string;
  price_eur: number;
  bedrooms: number | null;
  bathrooms: number | null;
  living_area_sqm: number | null;
  property_type: PropertyType;
  thumbnail_url: string | null;  // First image from image_urls
  image_urls: string[];          // Full array for map popups
  region_slug: string;
  latitude: number | null;       // For map display
  longitude: number | null;      // For map display
}

// ============================================================================
// FILTER TYPES (for query building)
// ============================================================================

/**
 * Filters for property search queries
 */
export interface PropertyFilters {
  region_slug?: string;
  price_min?: number;
  price_max?: number;
  bedrooms_min?: number;
  bedrooms_max?: number;
  bathrooms_min?: number;
  bathrooms_max?: number;
  living_area_min?: number;
  living_area_max?: number;
  property_types?: PropertyType[];
  city?: string;
  has_sea_view?: boolean;
  has_garden?: boolean;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
