-- ============================================================================
-- BACKFILL ADMIN USER PROFILE
-- ============================================================================
-- Purpose: Create user_profiles record for existing admin user who was
--          created before the email verification requirement was added.
-- User: admin@indabaxkenya.org (66078613-da1c-47b7-ae8f-d9395da181ef)
-- ============================================================================

-- Insert or update user profile for the existing admin
INSERT INTO public.user_profiles (
  id,
  email,
  email_verified,
  name,
  role,
  is_new_user,
  is_active,
  created_at,
  updated_at,
  last_login_at
)
SELECT
  id,
  email,
  true AS email_verified, -- Mark as verified (bypass email verification)
  COALESCE(raw_user_meta_data->>'name', 'Admin User') AS name,
  'admin' AS role,
  false AS is_new_user,
  true AS is_active,
  created_at,
  NOW() AS updated_at,
  last_sign_in_at AS last_login_at
FROM auth.users
WHERE id = '66078613-da1c-47b7-ae8f-d9395da181ef'
ON CONFLICT (id) DO UPDATE SET
  email_verified = true,
  role = 'admin',
  updated_at = NOW();

-- Create or update email verification token (mark as verified)
INSERT INTO public.email_verification_tokens (
  user_id,
  token,
  email,
  expires_at,
  verified_at,
  created_at
)
VALUES (
  '66078613-da1c-47b7-ae8f-d9395da181ef',
  'admin-verified-' || EXTRACT(EPOCH FROM NOW())::TEXT, -- Unique token
  'admin@indabaxkenya.org',
  NOW() + INTERVAL '1 year', -- Long expiry
  NOW(), -- Already verified
  NOW()
)
ON CONFLICT (token) DO NOTHING;

-- If a token already exists for this user/email, mark it as verified
UPDATE public.email_verification_tokens
SET verified_at = NOW()
WHERE user_id = '66078613-da1c-47b7-ae8f-d9395da181ef'
  AND email = 'admin@indabaxkenya.org'
  AND verified_at IS NULL;

-- Verify the insertion
DO $$
DECLARE
  profile_count INTEGER;
  token_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count
  FROM public.user_profiles
  WHERE id = '66078613-da1c-47b7-ae8f-d9395da181ef'
    AND email_verified = true
    AND role = 'admin';

  SELECT COUNT(*) INTO token_count
  FROM public.email_verification_tokens
  WHERE user_id = '66078613-da1c-47b7-ae8f-d9395da181ef'
    AND email = 'admin@indabaxkenya.org'
    AND verified_at IS NOT NULL;

  IF profile_count = 1 AND token_count >= 1 THEN
    RAISE NOTICE '✅ Admin profile backfilled successfully!';
    RAISE NOTICE 'User: admin@indabaxkenya.org';
    RAISE NOTICE 'Email Verified: true';
    RAISE NOTICE 'Role: admin';
    RAISE NOTICE 'Verification token: created and verified';
  ELSE
    RAISE WARNING '⚠️  Admin profile backfill may have failed. Please check manually.';
    RAISE WARNING 'Profile count: %, Token count: %', profile_count, token_count;
  END IF;
END $$;
