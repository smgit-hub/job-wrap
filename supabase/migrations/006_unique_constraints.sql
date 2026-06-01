-- =============================================================================
-- JobWrap — Unique constraints for local_id upserts
-- Migration: 006_unique_constraints.sql
--
-- Supabase upsert (ON CONFLICT) requires a unique constraint, not just an index.
-- These constraints allow the app to upsert by local_id without creating duplicates.
--
-- Run via Supabase Dashboard → SQL Editor
-- =============================================================================

-- reports: upsert by local_id
ALTER TABLE reports
  ADD CONSTRAINT reports_local_id_unique UNIQUE (local_id);

-- customers: upsert by local_id
ALTER TABLE customers
  ADD CONSTRAINT customers_local_id_unique UNIQUE (local_id);
