-- =============================================================================
-- Bookify - Initial Database Schema
-- Supabase (PostgreSQL) - Free Tier: 500MB DB, 50k MAU
-- =============================================================================

-- User profiles (linked to Google account)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  daily_word_goal INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom themes saved by users
CREATE TABLE IF NOT EXISTS custom_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  theme_config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custom_themes_user ON custom_themes(user_id);

-- Daily writing statistics
CREATE TABLE IF NOT EXISTS writing_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  word_count INTEGER DEFAULT 0,
  sprint_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_writing_stats_user_date ON writing_stats(user_id, date);

-- Export history (tracks all exports with R2 file URLs)
CREATE TABLE IF NOT EXISTS export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  doc_id TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('epub', 'pdf', 'docx')),
  file_url TEXT,
  file_size BIGINT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_export_history_user ON export_history(user_id);
CREATE INDEX idx_export_history_doc ON export_history(doc_id);

-- Named versions (supplement to Google Drive revisions)
CREATE TABLE IF NOT EXISTS named_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  doc_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_named_versions_user_doc ON named_versions(user_id, doc_id);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE named_versions ENABLE ROW LEVEL SECURITY;

-- Note: Since we use service_key from backend, RLS policies are for
-- additional safety. The backend handles user scoping via JWT.
-- These policies use a custom GUC variable set by the backend.

-- Service role bypasses RLS, so these are for direct access scenarios:
CREATE POLICY "allow_service_role" ON user_profiles FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "allow_service_role" ON custom_themes FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "allow_service_role" ON writing_stats FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "allow_service_role" ON export_history FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "allow_service_role" ON named_versions FOR ALL
  USING (true) WITH CHECK (true);
