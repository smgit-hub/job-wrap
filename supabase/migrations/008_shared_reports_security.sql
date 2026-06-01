-- =============================================================================
-- JobWrap — Shared Reports security hardening
-- Migration: 008_shared_reports_security.sql
--
-- 1. Adds user_id so rows are owned and orphan-cleanable
-- 2. Adds expires_at so links can expire (default 90 days)
-- 3. Tightens INSERT policy — requires an authenticated user
-- 4. Tightens SELECT policy — excludes expired links
-- 5. Adds DELETE policy so users can revoke their own links
--
-- Apply AFTER 007_fix_unique_constraints.sql.
-- =============================================================================

-- ── Schema changes ────────────────────────────────────────────────────────────

-- user_id: who created the share link (nullable for rows created before this migration)
ALTER TABLE shared_reports
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- expires_at: NULL = never expires (legacy rows), set = expires at that time
ALTER TABLE shared_reports
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Backfill expiry for any existing rows (90 days from creation)
UPDATE shared_reports
SET expires_at = created_at + INTERVAL '90 days'
WHERE expires_at IS NULL;

-- Index for fast expiry lookups
CREATE INDEX IF NOT EXISTS shared_reports_expires_at_idx
  ON shared_reports(expires_at)
  WHERE expires_at IS NOT NULL;


-- ── RLS policy updates ────────────────────────────────────────────────────────

-- Drop old permissive policies
DROP POLICY IF EXISTS "shared_reports: select public" ON shared_reports;
DROP POLICY IF EXISTS "shared_reports: insert anon" ON shared_reports;

-- SELECT: anyone can read a non-expired shared report (token is the credential)
CREATE POLICY "shared_reports: select non-expired"
  ON shared_reports FOR SELECT
  USING (expires_at IS NULL OR expires_at > NOW());

-- INSERT: must be authenticated — no anonymous writes
CREATE POLICY "shared_reports: insert authenticated"
  ON shared_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- DELETE: users can revoke their own links
CREATE POLICY "shared_reports: delete own"
  ON shared_reports FOR DELETE
  USING (auth.uid() = user_id);
