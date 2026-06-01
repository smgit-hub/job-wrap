-- Migration 007: Fix unique constraints to be per-user
-- The global unique constraint on local_id alone causes INSERT failures when
-- orphaned rows from a different user_id share the same local_id value.
-- Correct design: unique per user.

-- ── reports ───────────────────────────────────────────────────────────────────
ALTER TABLE reports
  DROP CONSTRAINT IF EXISTS reports_local_id_unique;

ALTER TABLE reports
  ADD CONSTRAINT reports_local_id_user_unique UNIQUE (local_id, user_id);

-- ── customers ─────────────────────────────────────────────────────────────────
ALTER TABLE customers
  DROP CONSTRAINT IF EXISTS customers_local_id_unique;

ALTER TABLE customers
  ADD CONSTRAINT customers_local_id_user_unique UNIQUE (local_id, user_id);
