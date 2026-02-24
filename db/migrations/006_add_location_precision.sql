-- Add location_precision column to properties table
-- Stores the uncertainty radius in meters for partial addresses
-- NULL means exact location, otherwise value is radius in meters

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS location_precision INTEGER DEFAULT NULL;

COMMENT ON COLUMN properties.location_precision IS 'Location uncertainty radius in meters. NULL = exact, otherwise shows as circle on map.';
