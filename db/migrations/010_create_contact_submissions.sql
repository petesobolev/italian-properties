-- Create contact_submissions table to log all contact form submissions
-- This provides a record of all inquiries for tracking and follow-up

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Submitter information
  submitter_name VARCHAR(255) NOT NULL,
  submitter_email VARCHAR(255) NOT NULL,
  submitter_phone VARCHAR(50),
  message TEXT NOT NULL,

  -- Property information
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  property_title VARCHAR(500),

  -- Agent/recipient information
  agent_email VARCHAR(255) NOT NULL,
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  source_name VARCHAR(255),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Optional: track if email was sent successfully
  email_sent BOOLEAN DEFAULT FALSE,
  email_error TEXT
);

-- Index for querying by date
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at DESC);

-- Index for querying by source/agent
CREATE INDEX idx_contact_submissions_source_id ON contact_submissions(source_id);

-- Index for querying by property
CREATE INDEX idx_contact_submissions_property_id ON contact_submissions(property_id);

-- Enable RLS
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Sources can view submissions for their properties
CREATE POLICY "Sources can view own submissions"
  ON contact_submissions
  FOR SELECT
  USING (source_id IN (SELECT id FROM sources));
