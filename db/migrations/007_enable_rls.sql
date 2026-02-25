/**
 * Migration: Enable Row Level Security
 *
 * This migration secures all tables by enabling RLS and creating
 * appropriate policies. The app uses DATABASE_URL (service_role)
 * which bypasses RLS, so these policies protect against direct
 * Supabase API access using the anon/authenticated keys.
 *
 * Security model:
 * - service_role: Full access (used by our Next.js backend)
 * - anon: Read-only access to public data (regions, non-sensitive property fields)
 * - authenticated: Same as anon (we don't use Supabase Auth)
 *
 * IMPORTANT: admin_token in sources table must NEVER be exposed to anon/authenticated
 */

-- ============================================================================
-- REGIONS TABLE
-- Public read access is fine - no sensitive data
-- ============================================================================

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (bypasses RLS by default, but explicit is clearer)
CREATE POLICY "service_role_full_access_regions" ON regions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to read regions (public data)
CREATE POLICY "anon_read_regions" ON regions
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to read regions
CREATE POLICY "authenticated_read_regions" ON regions
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- PROPERTIES TABLE
-- Public read access for non-archived properties is fine
-- Write access should be restricted
-- ============================================================================

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access
CREATE POLICY "service_role_full_access_properties" ON properties
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to read non-archived properties only
CREATE POLICY "anon_read_properties" ON properties
  FOR SELECT
  TO anon
  USING (is_archived = false OR is_archived IS NULL);

-- Allow authenticated users to read non-archived properties
CREATE POLICY "authenticated_read_properties" ON properties
  FOR SELECT
  TO authenticated
  USING (is_archived = false OR is_archived IS NULL);

-- ============================================================================
-- SOURCES TABLE
-- CRITICAL: admin_token must NEVER be exposed
-- Only allow reading non-sensitive columns
-- ============================================================================

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access
CREATE POLICY "service_role_full_access_sources" ON sources
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- DENY all access to anon for sources table
-- The app joins sources for display name only, which is done server-side
-- If you need to expose source names publicly, create a view instead
CREATE POLICY "anon_no_access_sources" ON sources
  FOR SELECT
  TO anon
  USING (false);

-- DENY all access to authenticated for sources table
CREATE POLICY "authenticated_no_access_sources" ON sources
  FOR SELECT
  TO authenticated
  USING (false);

-- ============================================================================
-- REVOKE unnecessary privileges from anon and authenticated
-- These roles should only have SELECT where permitted by RLS
-- ============================================================================

-- Revoke write permissions from anon
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON regions FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON properties FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON sources FROM anon;

-- Revoke write permissions from authenticated
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON regions FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON properties FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON sources FROM authenticated;

-- ============================================================================
-- Verification queries (run these after migration to confirm)
-- ============================================================================

-- Check RLS is enabled:
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('regions', 'properties', 'sources');

-- Check policies exist:
-- SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public';

COMMENT ON POLICY "anon_no_access_sources" ON sources IS
  'Blocks anon access to sources table to protect admin_token';
