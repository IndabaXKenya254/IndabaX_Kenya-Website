-- ═══════════════════════════════════════════════════════════════════════
-- FORM RESPONSES RLS POLICIES - AUTHENTICATED USERS ONLY
-- ═══════════════════════════════════════════════════════════════════════
-- Registration requires authentication
-- Users must be logged in to register for events

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public to insert form responses" ON form_responses;
DROP POLICY IF EXISTS "Allow public to view own form responses" ON form_responses;
DROP POLICY IF EXISTS "Allow public to update own form responses" ON form_responses;
DROP POLICY IF EXISTS "Allow admins full access to form responses" ON form_responses;

-- Enable RLS on form_responses table
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to insert their own form responses
CREATE POLICY "Allow authenticated users to insert form responses"
ON form_responses
FOR INSERT
TO authenticated
WITH CHECK (
  -- User must be authenticated and inserting their own email
  auth.uid() IS NOT NULL
  AND respondent_email = auth.email()
);

-- Policy 2: Allow authenticated users to view their own responses
CREATE POLICY "Allow authenticated users to view own form responses"
ON form_responses
FOR SELECT
TO authenticated
USING (
  -- User can view if email matches their auth email
  respondent_email = auth.email()
  OR
  -- Or if they are an admin
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- Policy 3: Allow authenticated users to update their own incomplete responses
CREATE POLICY "Allow authenticated users to update own form responses"
ON form_responses
FOR UPDATE
TO authenticated
USING (
  -- Can only update own in-progress responses
  status = 'in_progress'
  AND respondent_email = auth.email()
)
WITH CHECK (
  -- Cannot change status to completed or change email
  status = 'in_progress'
  AND respondent_email = auth.email()
);

-- Policy 4: Allow admins full access to all form responses
CREATE POLICY "Allow admins full access to form responses"
ON form_responses
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);
