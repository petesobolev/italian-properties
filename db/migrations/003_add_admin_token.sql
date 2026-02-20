-- Migration: Add admin_token to sources table
-- This enables token-based authentication for the admin portal
-- Each agent/source gets a unique secret token to access their properties

-- Add admin_token column (nullable to start)
ALTER TABLE sources
ADD COLUMN IF NOT EXISTS admin_token VARCHAR(64) UNIQUE;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_sources_admin_token ON sources(admin_token) WHERE admin_token IS NOT NULL;

-- Example: Generate tokens for existing sources
-- Run this manually for each source you want to enable:
-- UPDATE sources SET admin_token = encode(gen_random_bytes(24), 'hex') WHERE name = 'Agent Name';
