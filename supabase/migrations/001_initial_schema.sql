-- =============================================================================
-- JobWrap — Initial Schema
-- Migration: 001_initial_schema.sql
--
-- Run via Supabase CLI:  supabase db push
-- Or paste into the Supabase Dashboard → SQL Editor
-- =============================================================================

-- ── profiles ─────────────────────────────────────────────────────────────────
-- One profile per authenticated user.
-- The id is a foreign key to Supabase Auth (auth.users).

CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatically create a profile row when a new user signs up.
-- This runs server-side so the client never needs to call upsertProfile().
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();


-- ── business_settings ────────────────────────────────────────────────────────
-- One row per user. Stores branding and contact info shown on service reports.
-- UNIQUE(user_id) enforces one business profile per account.
--
-- TODO (future teams): replace user_id FK with org_id to support a company
-- with multiple technician accounts sharing the same branding.

CREATE TABLE IF NOT EXISTS business_settings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name    TEXT NOT NULL DEFAULT '',
  technician_name  TEXT NOT NULL DEFAULT '',
  phone            TEXT NOT NULL DEFAULT '',
  email            TEXT NOT NULL DEFAULT '',
  license_number   TEXT NOT NULL DEFAULT '',
  brand_color      TEXT NOT NULL DEFAULT '#0ea5e9',
  logo_url         TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT business_settings_user_id_unique UNIQUE (user_id)
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_business_settings_updated_at ON business_settings;
CREATE TRIGGER set_business_settings_updated_at
  BEFORE UPDATE ON business_settings
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();


-- ── reports ───────────────────────────────────────────────────────────────────
-- Each row is one service report.
-- report_data (JSONB) stores the full generated report content and business
-- snapshot at time of creation — making each report self-contained.
--
-- service_type is a TEXT column (not an enum) so new service verticals
-- (cleaning, landscaping, pest-control, etc.) can be added without a migration.
--
-- TODO (future): add a "template_id" column when multi-template PDF support is added
-- TODO (future): add "shared_token" UUID for customer-facing read-only report links
-- TODO (future): add "photos" JSONB array for before/after image URLs

CREATE TABLE IF NOT EXISTS reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'complete')),
  customer_name    TEXT NOT NULL DEFAULT '',
  service_address  TEXT NOT NULL DEFAULT '',
  service_type     TEXT NOT NULL DEFAULT 'other',
  equipment_type   TEXT NOT NULL DEFAULT '',
  job_date         DATE NOT NULL,
  rough_notes      TEXT NOT NULL DEFAULT '',
  report_data      JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_reports_updated_at ON reports;
CREATE TRIGGER set_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Index for fast per-user report lookups (used by getUserReports())
CREATE INDEX IF NOT EXISTS reports_user_id_created_at_idx
  ON reports(user_id, created_at DESC);
