-- =============================================================================
-- JobWrap — Row Level Security Policies
-- Migration: 002_rls_policies.sql
--
-- These policies enforce that users can only access their own data.
-- All three tables are scoped to auth.uid() = user_id (or id for profiles).
--
-- Apply AFTER 001_initial_schema.sql.
-- Run via Supabase CLI:  supabase db push
-- Or paste into the Supabase Dashboard → SQL Editor
-- =============================================================================


-- ── profiles ──────────────────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles: select own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
-- (The trigger also inserts, so this covers manual upsert from the client)
CREATE POLICY "profiles: insert own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles: update own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- NOTE (future teams): if multi-org support is added, replace auth.uid() = id
-- with a join to an org_members table so admins can view all member profiles.


-- ── business_settings ────────────────────────────────────────────────────────

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- Users can read their own business settings
CREATE POLICY "business_settings: select own"
  ON business_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own business settings
CREATE POLICY "business_settings: insert own"
  ON business_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own business settings
CREATE POLICY "business_settings: update own"
  ON business_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own business settings
CREATE POLICY "business_settings: delete own"
  ON business_settings FOR DELETE
  USING (auth.uid() = user_id);

-- NOTE (future teams): if org-level branding is added, change user_id to org_id
-- and gate on org membership rather than direct user match.


-- ── reports ───────────────────────────────────────────────────────────────────

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can read their own reports
CREATE POLICY "reports: select own"
  ON reports FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create reports
CREATE POLICY "reports: insert own"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports
CREATE POLICY "reports: update own"
  ON reports FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own reports
CREATE POLICY "reports: delete own"
  ON reports FOR DELETE
  USING (auth.uid() = user_id);

-- NOTE (future): when customer-facing shared report links are added, add a
-- separate SELECT policy gated on a "shared_token" UUID column so unauthenticated
-- viewers can read a single report without bypassing user_id checks:
--
-- CREATE POLICY "reports: select by shared token"
--   ON reports FOR SELECT
--   USING (shared_token IS NOT NULL AND shared_token = current_setting('app.token')::UUID);
