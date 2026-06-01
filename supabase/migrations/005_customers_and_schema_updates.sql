-- =============================================================================
-- JobWrap — Customers table, schema updates, report-images bucket
-- Migration: 005_customers_and_schema_updates.sql
--
-- 1. Adds the customers table
-- 2. Extends reports with local_id, deleted_at, next_service_date
-- 3. Extends business_settings with missing branding fields
-- 4. Creates the report-images storage bucket for job photos
--
-- Apply AFTER 004_shared_reports.sql.
-- Run via Supabase CLI:  supabase db push
-- Or paste into the Supabase Dashboard → SQL Editor
-- =============================================================================


-- ── customers ─────────────────────────────────────────────────────────────────
-- One row per customer per user. Persists across jobs so returning customers
-- pre-fill the new job flow (address, equipment, site notes, etc.)

CREATE TABLE IF NOT EXISTS customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  local_id    TEXT,                          -- app-side cust_xxx ID for migration
  name        TEXT NOT NULL DEFAULT '',
  address     TEXT NOT NULL DEFAULT '',
  site_notes  TEXT NOT NULL DEFAULT '',
  phone       TEXT,
  email       TEXT,
  equipment   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_customers_updated_at ON customers;
CREATE TRIGGER set_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Fast per-user customer lookups
CREATE INDEX IF NOT EXISTS customers_user_id_idx
  ON customers(user_id);

-- Unique per user by name (case-insensitive match handled in app layer)
CREATE INDEX IF NOT EXISTS customers_user_id_name_idx
  ON customers(user_id, lower(name));


-- ── RLS — customers ───────────────────────────────────────────────────────────

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers: select own"
  ON customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "customers: insert own"
  ON customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "customers: update own"
  ON customers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "customers: delete own"
  ON customers FOR DELETE
  USING (auth.uid() = user_id);


-- ── reports — extend with missing columns ─────────────────────────────────────

-- local_id: stores the app-side rpt_xxx ID so we can match rows during migration
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS local_id TEXT;

CREATE INDEX IF NOT EXISTS reports_local_id_idx
  ON reports(local_id) WHERE local_id IS NOT NULL;

-- deleted_at: soft-delete — NULL = active, set = in trash
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- next_service_date: optional recommended next service date
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS next_service_date DATE;


-- ── business_settings — extend with missing branding fields ───────────────────

-- Two licence fields (ARCtick, Gas Safe, EPA 608, etc.)
ALTER TABLE business_settings
  ADD COLUMN IF NOT EXISTS licence1_label  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS licence1_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS licence2_label  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS licence2_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tagline         TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS website         TEXT NOT NULL DEFAULT '';


-- ── report-images storage bucket ─────────────────────────────────────────────
-- Private bucket — photos are accessed via signed URLs.
-- File path convention: report-images/{userId}/{reportId}/{photoId}.jpg

INSERT INTO storage.buckets (id, name, public)
VALUES ('report-images', 'report-images', false)
ON CONFLICT (id) DO NOTHING;

-- Users can read their own photos
CREATE POLICY "report-images: select own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'report-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can upload photos to their own folder
CREATE POLICY "report-images: insert own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'report-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can overwrite their own photos
CREATE POLICY "report-images: update own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'report-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own photos
CREATE POLICY "report-images: delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'report-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
