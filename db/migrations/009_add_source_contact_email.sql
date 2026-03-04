-- Migration: Add contact email to sources
-- This email is used to receive property inquiry messages from potential buyers

ALTER TABLE sources
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255) DEFAULT NULL;

COMMENT ON COLUMN sources.contact_email IS 'Email address for receiving property inquiries';
