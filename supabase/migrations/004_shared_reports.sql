-- =============================================================================
-- JobWrap — Shared Reports
-- Migration: 004_shared_reports.sql
--
-- Customer-facing read-only report links.
-- No auth required — the token IS the credential.
-- Intentionally separate from the `reports` table so unauthenticated access
-- doesn't require touching the user-scoped RLS policies.
--
-- Run via Supabase CLI:  supabase db push
-- Or paste into the Supabase Dashboard → SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS shared_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token        TEXT UNIQUE NOT NULL,               -- short hex token — the share URL slug
  report_data  JSONB NOT NULL,                     -- full ServiceReport JSON snapshot
  photos       JSONB NOT NULL DEFAULT '[]',         -- JobPhoto[] — base64 data URLs
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast token lookups (every page view hits this)
CREATE INDEX IF NOT EXISTS shared_reports_token_idx
  ON shared_reports(token);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Shared reports are intentionally public — the token is the access control.

ALTER TABLE shared_reports ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can read a shared report
CREATE POLICY "shared_reports: select public"
  ON shared_reports FOR SELECT
  USING (true);

-- The server-side API route inserts using the anon key
CREATE POLICY "shared_reports: insert anon"
  ON shared_reports FOR INSERT
  WITH CHECK (true);
