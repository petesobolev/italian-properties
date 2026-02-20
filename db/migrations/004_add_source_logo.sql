-- Migration: Add logo_url to sources table
-- Allows displaying agent/source logos on property cards

ALTER TABLE sources
ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
