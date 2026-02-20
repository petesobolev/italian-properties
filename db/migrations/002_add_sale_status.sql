-- Migration: Add sale_status column to properties table
-- Tracks whether a property is available, in contract, or sold

ALTER TABLE properties
ADD COLUMN sale_status VARCHAR(20) DEFAULT 'available';

-- Index for filtering by sale status
CREATE INDEX idx_properties_sale_status ON properties(sale_status);
