-- =============================================================================
-- JobWrap — Consolidated Schema
-- Generated from migrations 001–008
--
-- Paste this entire file into the Supabase Dashboard → SQL Editor on a
-- fresh project and run it. No need to run individual migration files.
-- =============================================================================


-- ── profiles ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: select own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: insert own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles: update own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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


-- ── Shared updated_at trigger ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ── business_settings ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_settings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name    TEXT NOT NULL DEFAULT '',
  technician_name  TEXT NOT NULL DEFAULT '',
  phone            TEXT NOT NULL DEFAULT '',
  email            TEXT NOT NULL DEFAULT '',
  license_number   TEXT NOT NULL DEFAULT '',
  licence1_label   TEXT NOT NULL DEFAULT '',
  licence1_number  TEXT NOT NULL DEFAULT '',
  licence2_label   TEXT NOT NULL DEFAULT '',
  licence2_number  TEXT NOT NULL DEFAULT '',
  brand_color      TEXT NOT NULL DEFAULT '#0ea5e9',
  tagline          TEXT NOT NULL DEFAULT '',
  website          TEXT NOT NULL DEFAULT '',
  logo_url         TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT business_settings_user_id_unique UNIQUE (user_id)
);

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_settings: select own" ON business_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "business_settings: insert own" ON business_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "business_settings: update own" ON business_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "business_settings: delete own" ON business_settings FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_business_settings_updated_at ON business_settings;
CREATE TRIGGER set_business_settings_updated_at
  BEFORE UPDATE ON business_settings
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();


-- ── reports ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reports (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  local_id           TEXT,
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'complete')),
  customer_name      TEXT NOT NULL DEFAULT '',
  service_address    TEXT NOT NULL DEFAULT '',
  service_type       TEXT NOT NULL DEFAULT 'other',
  equipment_type     TEXT NOT NULL DEFAULT '',
  job_date           DATE NOT NULL,
  rough_notes        TEXT NOT NULL DEFAULT '',
  report_data        JSONB NOT NULL DEFAULT '{}',
  next_service_date  DATE,
  deleted_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reports_local_id_user_unique UNIQUE (local_id, user_id)
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports: select own" ON reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reports: insert own" ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports: update own" ON reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reports: delete own" ON reports FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_reports_updated_at ON reports;
CREATE TRIGGER set_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE INDEX IF NOT EXISTS reports_user_id_created_at_idx ON reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_local_id_idx ON reports(local_id) WHERE local_id IS NOT NULL;


-- ── customers ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  local_id   TEXT,
  name       TEXT NOT NULL DEFAULT '',
  address    TEXT NOT NULL DEFAULT '',
  site_notes TEXT NOT NULL DEFAULT '',
  phone      TEXT,
  email      TEXT,
  equipment  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT customers_local_id_user_unique UNIQUE (local_id, user_id)
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers: select own" ON customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "customers: insert own" ON customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "customers: update own" ON customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "customers: delete own" ON customers FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_customers_updated_at ON customers;
CREATE TRIGGER set_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE INDEX IF NOT EXISTS customers_user_id_idx ON customers(user_id);
CREATE INDEX IF NOT EXISTS customers_user_id_name_idx ON customers(user_id, lower(name));


-- ── shared_reports ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shared_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT UNIQUE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_data JSONB NOT NULL,
  photos      JSONB NOT NULL DEFAULT '[]',
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE shared_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared_reports: select non-expired"
  ON shared_reports FOR SELECT
  USING (expires_at IS NULL OR expires_at > NOW());

CREATE POLICY "shared_reports: insert authenticated"
  ON shared_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "shared_reports: delete own"
  ON shared_reports FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS shared_reports_token_idx ON shared_reports(token);
CREATE INDEX IF NOT EXISTS shared_reports_expires_at_idx ON shared_reports(expires_at) WHERE expires_at IS NOT NULL;


-- ── Storage buckets ───────────────────────────────────────────────────────────

-- Logos (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "logos: public read"   ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "logos: insert own"    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "logos: update own"    ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "logos: delete own"    ON storage.objects FOR DELETE USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Report photos (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('report-images', 'report-images', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "report-images: select own" ON storage.objects FOR SELECT USING (bucket_id = 'report-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "report-images: insert own" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'report-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "report-images: update own" ON storage.objects FOR UPDATE USING (bucket_id = 'report-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "report-images: delete own" ON storage.objects FOR DELETE USING (bucket_id = 'report-images' AND auth.uid()::text = (storage.foldername(name))[1]);
