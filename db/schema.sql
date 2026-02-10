-- Italian Properties Database Schema
-- PostgreSQL schema for property listings application
--
-- Architecture notes:
-- - UUIDs used for primary keys to support distributed systems and prevent ID enumeration
-- - Timestamps use TIMESTAMPTZ for timezone-aware storage
-- - Foreign keys enforce referential integrity between tables
-- - Indexes added for common query patterns (region lookups, price filtering)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- REGIONS TABLE
-- Stores the Italian regions covered by the application
-- ============================================================================
CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,          -- URL-friendly identifier (e.g., "tuscany")
    name VARCHAR(100) NOT NULL,                 -- Display name (e.g., "Tuscany")
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Index for slug lookups (used in URL routing)
CREATE INDEX idx_regions_slug ON regions(slug);

-- ============================================================================
-- SOURCES TABLE
-- Stores real estate agencies/websites that listings are scraped from
-- ============================================================================
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,                 -- Agency name (e.g., "Immobiliare.it")
    base_url VARCHAR(500) NOT NULL,             -- Website base URL
    is_active BOOLEAN DEFAULT true,             -- Whether to include in scraping runs
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PROPERTIES TABLE
-- Core table storing all property listings
-- ============================================================================
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE RESTRICT,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE RESTRICT,

    -- Location
    city VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 8),                    -- GPS latitude for map display
    longitude DECIMAL(11, 8),                   -- GPS longitude for map display

    -- Pricing
    price_eur INTEGER NOT NULL,                 -- Price in euros (whole numbers)

    -- Property details (nullable as not always available from listings)
    bedrooms INTEGER,                           -- Number of bedrooms
    bathrooms INTEGER,                          -- Number of bathrooms
    living_area_sqm INTEGER,                    -- Living area in square meters

    -- Property classification
    property_type VARCHAR(100) NOT NULL,        -- e.g., "apartment", "villa", "farmhouse"

    -- Media and content
    image_urls JSONB DEFAULT '[]'::jsonb,       -- Array of image URLs stored as JSON
    description_it TEXT,                        -- Original Italian description
    description_en TEXT,                        -- Pre-translated English description

    -- Property features (extracted from description or listing data)
    has_sea_view BOOLEAN,                       -- Property has a sea view
    has_garden BOOLEAN,                         -- Property has a garden
    has_pool BOOLEAN,                           -- Property has a pool
    has_terrace BOOLEAN,                        -- Property has a terrace
    has_balcony BOOLEAN,                        -- Property has a balcony
    has_parking BOOLEAN,                        -- Property has parking
    has_garage BOOLEAN,                         -- Property has a garage
    has_fireplace BOOLEAN,                      -- Property has a fireplace
    has_air_conditioning BOOLEAN,               -- Property has A/C
    has_elevator BOOLEAN,                       -- Building has an elevator
    is_renovated BOOLEAN,                       -- Property is renovated
    has_mountain_view BOOLEAN,                  -- Property has mountain view
    has_panoramic_view BOOLEAN,                 -- Property has panoramic view
    floor_number INTEGER,                       -- Floor number (0 = ground)
    year_built INTEGER,                         -- Year of construction
    energy_class VARCHAR(10),                   -- Energy efficiency class (A-G)

    -- Source tracking
    listing_url VARCHAR(1000) UNIQUE NOT NULL,  -- Original listing URL (used for deduplication)

    -- Timestamps
    last_seen_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,  -- When listing was last verified active
    source_updated_at TIMESTAMPTZ,                       -- When listing was updated on source website
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common query patterns
CREATE INDEX idx_properties_region_id ON properties(region_id);
CREATE INDEX idx_properties_source_id ON properties(source_id);
CREATE INDEX idx_properties_price_eur ON properties(price_eur);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_listing_url ON properties(listing_url);

-- Composite index for filtered region queries (most common access pattern)
CREATE INDEX idx_properties_region_price ON properties(region_id, price_eur);

-- Partial indexes for feature filters (only index true values for efficiency)
CREATE INDEX idx_properties_sea_view ON properties(has_sea_view) WHERE has_sea_view = true;
CREATE INDEX idx_properties_garden ON properties(has_garden) WHERE has_garden = true;

-- Index for sorting by source update date (NULLS LAST for graceful fallback)
CREATE INDEX idx_properties_source_updated ON properties(source_updated_at DESC NULLS LAST);

-- ============================================================================
-- SEED DATA
-- Initial regions for the application
-- ============================================================================
INSERT INTO regions (slug, name) VALUES
    ('tuscany', 'Tuscany'),
    ('calabria', 'Calabria'),
    ('puglia', 'Puglia');

-- ============================================================================
-- SAMPLE QUERIES (for testing)
-- ============================================================================

-- Sample: Insert a source
-- INSERT INTO sources (name, base_url) VALUES ('Example Agency', 'https://example-agency.it');

-- Sample: Insert a property
-- INSERT INTO properties (region_id, source_id, city, price_eur, bedrooms, bathrooms, living_area_sqm, property_type, image_urls, description_it, listing_url)
-- SELECT r.id, s.id, 'Florence', 250000, 2, 1, 85, 'apartment', '["https://example.com/img1.jpg"]'::jsonb, 'Bellissimo appartamento nel centro storico...', 'https://example-agency.it/listing/12345'
-- FROM regions r, sources s
-- WHERE r.slug = 'tuscany' AND s.name = 'Example Agency';

-- Sample: Get properties by region with source info
-- SELECT p.*, r.name as region_name, s.name as source_name
-- FROM properties p
-- JOIN regions r ON p.region_id = r.id
-- JOIN sources s ON p.source_id = s.id
-- WHERE r.slug = 'tuscany'
-- ORDER BY p.price_eur ASC;
