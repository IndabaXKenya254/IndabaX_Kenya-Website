-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - PASSWORD MANAGEMENT SYSTEM
-- ═══════════════════════════════════════════════════════════════════════
-- Migration: 20251229_password_management.sql
-- Purpose: Add password reset tokens and admin password management
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 1. PASSWORD RESET TOKENS TABLE
-- ═══════════════════════════════════════════════════════════════════════
-- Used for forgot password functionality for all users

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Enable RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can create a reset token (for forgot password)
CREATE POLICY "Anyone can create password reset tokens"
  ON password_reset_tokens
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can view their own tokens (for validation)
CREATE POLICY "Anyone can view tokens by token value"
  ON password_reset_tokens
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Service role can do everything
CREATE POLICY "Service role full access on password_reset_tokens"
  ON password_reset_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════
-- 2. ADD must_change_password TO admin_roles
-- ═══════════════════════════════════════════════════════════════════════
-- Flag to force password change on first login for invited admins

ALTER TABLE admin_roles
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

-- Comment for documentation
COMMENT ON COLUMN admin_roles.must_change_password IS
  'When TRUE, admin must change password on next login. Set to TRUE when admin is invited with temporary password.';

-- ═══════════════════════════════════════════════════════════════════════
-- 3. CLEANUP FUNCTION FOR EXPIRED TOKENS
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION cleanup_expired_password_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW()
    OR used_at IS NOT NULL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION cleanup_expired_password_tokens() TO service_role;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE ON password_reset_tokens TO anon;
GRANT SELECT, INSERT, UPDATE ON password_reset_tokens TO authenticated;
GRANT ALL ON password_reset_tokens TO service_role;
