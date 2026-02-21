-- Per-user settings (e.g. current bank balance)
-- Run this in the Supabase SQL Editor if you're not using Supabase CLI migrations.

CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Allow backend (service role) to read/write; optional: add RLS for direct client access
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add user_id to transactions so rows can be per-user (nullable = seed/demo rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Optional: index for per-user transaction lookups
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

COMMENT ON TABLE user_settings IS 'Per-user app settings (e.g. current_balance).';
COMMENT ON COLUMN transactions.user_id IS 'When set, row belongs to this user; NULL = seed/demo data by user_type.';
