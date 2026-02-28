-- Migration: Add title column to properties table
-- This stores the original listing title from source websites

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT NULL;

COMMENT ON COLUMN properties.title IS 'Original listing title from source website';
