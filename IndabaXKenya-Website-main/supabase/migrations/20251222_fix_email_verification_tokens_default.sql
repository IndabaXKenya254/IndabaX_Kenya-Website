-- ═══════════════════════════════════════════════════════════════════════
-- FIX: Add DEFAULT constraint to email_verification_tokens.expires_at
-- ═══════════════════════════════════════════════════════════════════════
-- Date: December 22, 2025
-- Issue: expires_at column has NOT NULL constraint but no DEFAULT value
-- This causes errors when inserting without explicitly providing expires_at
--
-- Root Cause:
-- The migration file 20250120_email_verification_tokens.sql specified:
--   expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
-- But the DEFAULT constraint was never applied or was removed
--
-- Solution:
-- Add DEFAULT constraint to automatically set expiration to 24 hours from now
-- ═══════════════════════════════════════════════════════════════════════

-- Add DEFAULT constraint to expires_at column
ALTER TABLE public.email_verification_tokens
  ALTER COLUMN expires_at SET DEFAULT (NOW() + INTERVAL '24 hours');

-- Verify the change
COMMENT ON COLUMN public.email_verification_tokens.expires_at IS
  'Token expiration timestamp. Defaults to 24 hours from creation. Updated: 2025-12-22';

-- Show confirmation
DO $$
BEGIN
  RAISE NOTICE 'SUCCESS: DEFAULT constraint added to email_verification_tokens.expires_at';
  RAISE NOTICE 'Tokens will now expire 24 hours after creation by default';
END $$;
