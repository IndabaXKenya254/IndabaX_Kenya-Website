-- ═══════════════════════════════════════════════════════════════════════
-- CUSTOM EMAIL VERIFICATION TOKENS TABLE
-- ═══════════════════════════════════════════════════════════════════════
-- Store verification tokens for manual email verification handling
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Index for fast token lookup
  CONSTRAINT unique_token UNIQUE(token)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_email ON public.email_verification_tokens(email);

-- RLS Policies
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tokens
CREATE POLICY "Users can view own verification tokens"
  ON public.email_verification_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only authenticated users can insert their own tokens
CREATE POLICY "Users can create own verification tokens"
  ON public.email_verification_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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
