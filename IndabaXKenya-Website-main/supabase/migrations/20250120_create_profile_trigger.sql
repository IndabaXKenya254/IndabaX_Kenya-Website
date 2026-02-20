-- ═══════════════════════════════════════════════════════════════════════
-- AUTOMATIC USER PROFILE CREATION TRIGGER
-- ═══════════════════════════════════════════════════════════════════════
-- This trigger automatically creates a user_profiles record when a new user
-- signs up via Supabase Auth. This is the recommended approach per Supabase docs.
--
-- Reference: https://supabase.com/docs/guides/auth/managing-user-data
-- ═══════════════════════════════════════════════════════════════════════

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    name,
    organization,
    phone,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'organization', NULL),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    'applicant', -- Default role for new users
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS
'Automatically creates a user profile in public.user_profiles when a new user signs up.
Extracts metadata (name, organization, phone) from raw_user_meta_data passed during signup.';
