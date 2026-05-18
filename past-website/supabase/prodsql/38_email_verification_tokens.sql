-- ═══════════════════════════════════════════════════════════════════════
-- CUSTOM EMAIL VERIFICATION TOKENS TABLE
-- ═══════════════════════════════════════════════════════════════════════
-- Store verification tokens for manual email verification handling
-- Note: Table created in file 35, this file adds user_id column if missing
-- ═══════════════════════════════════════════════════════════════════════

-- Create table if it doesn't exist (from file 35)
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'email_verification_tokens'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.email_verification_tokens
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

    RAISE NOTICE 'Added user_id column to email_verification_tokens';
  END IF;
END $$;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_email ON public.email_verification_tokens(email);

-- RLS Policies
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own verification tokens" ON public.email_verification_tokens;
DROP POLICY IF EXISTS "Users can create own verification tokens" ON public.email_verification_tokens;
DROP POLICY IF EXISTS "Admins can view all verification tokens" ON public.email_verification_tokens;

-- Users can only see their own tokens (or tokens with no user_id for backwards compatibility)
CREATE POLICY "Users can view own verification tokens"
  ON public.email_verification_tokens
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Only authenticated users can insert their own tokens
CREATE POLICY "Users can create own verification tokens"
  ON public.email_verification_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admins can see all tokens
CREATE POLICY "Admins can view all verification tokens"
  ON public.email_verification_tokens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.email_verification_tokens IS
'Stores email verification tokens for custom verification flow. Tokens expire after 24 hours.';
