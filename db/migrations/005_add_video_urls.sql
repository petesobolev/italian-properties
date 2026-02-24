-- Add video_urls column to properties table
-- Supports both uploaded videos (Vercel Blob URLs) and YouTube embed URLs

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS video_urls JSONB DEFAULT '[]'::jsonb;

-- Add index for properties with videos (for filtering)
CREATE INDEX IF NOT EXISTS idx_properties_has_videos
ON properties ((jsonb_array_length(video_urls) > 0))
WHERE video_urls IS NOT NULL AND jsonb_array_length(video_urls) > 0;
