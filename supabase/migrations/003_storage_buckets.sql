-- =============================================================================
-- JobWrap — Storage Buckets
-- Migration: 003_storage_buckets.sql
--
-- Creates the "logos" bucket for business logo images.
-- Storage RLS policies mirror the database policies — users can only
-- read/write files under their own userId prefix.
--
-- Apply AFTER 002_rls_policies.sql.
-- Run via Supabase CLI:  supabase db push
-- Or paste into the Supabase Dashboard → SQL Editor
-- =============================================================================


-- ── logos bucket ─────────────────────────────────────────────────────────────
-- public = true so logo images can be embedded in PDFs and shared reports
-- without requiring a signed URL on every request.
-- File paths are namespaced by userId: logos/{userId}/logo.{ext}

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;


-- ── Storage RLS — logos ───────────────────────────────────────────────────────

-- Anyone can read logo files (bucket is public; policy ensures it's explicit)
CREATE POLICY "logos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

-- Users can upload/replace their own logo (path must start with their userId)
CREATE POLICY "logos: insert own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update (overwrite) their own logo
CREATE POLICY "logos: update own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own logo
CREATE POLICY "logos: delete own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ── Future buckets ────────────────────────────────────────────────────────────
-- TODO (future): "report-images" bucket for before/after job photos
-- File paths: report-images/{userId}/{reportId}/{filename}
-- Bucket visibility: private (signed URLs for customer links)
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('report-images', 'report-images', false)
-- ON CONFLICT (id) DO NOTHING;
