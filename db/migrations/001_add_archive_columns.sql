-- Migration: Add archive columns to properties table
-- Enables soft delete for stale listings that can be viewed on an archived listings page

ALTER TABLE properties
ADD COLUMN is_archived BOOLEAN DEFAULT false,
ADD COLUMN archived_at TIMESTAMPTZ;

-- Index for filtering active vs archived properties
CREATE INDEX idx_properties_is_archived ON properties(is_archived);

-- Partial index for archived listings (for the archived page)
CREATE INDEX idx_properties_archived ON properties(archived_at DESC) WHERE is_archived = true;
