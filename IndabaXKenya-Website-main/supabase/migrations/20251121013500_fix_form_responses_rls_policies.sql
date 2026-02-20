-- Add RLS policies for form_responses table
-- Allow public users to create and update their own form responses

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public to insert form responses" ON form_responses;
DROP POLICY IF EXISTS "Allow public to view own form responses" ON form_responses;
DROP POLICY IF EXISTS "Allow public to update own form responses" ON form_responses;
DROP POLICY IF EXISTS "Allow admins full access to form responses" ON form_responses;

-- Enable RLS on form_responses table (if not already enabled)
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anyone to insert form responses (registration)
CREATE POLICY "Allow public to insert form responses"
ON form_responses
FOR INSERT
TO public
WITH CHECK (true);

-- Policy 2: Allow users to view their own responses by email
CREATE POLICY "Allow public to view own form responses"
ON form_responses
FOR SELECT
TO public
USING (
  respondent_email = current_setting('request.jwt.claims', true)::json->>'email'
  OR respondent_email = current_setting('app.current_user_email', true)
  OR auth.uid() IS NOT NULL
);

-- Policy 3: Allow users to update their own incomplete responses
CREATE POLICY "Allow public to update own form responses"
ON form_responses
FOR UPDATE
TO public
USING (
  status = 'in_progress'
  AND (
    respondent_email = current_setting('request.jwt.claims', true)::json->>'email'
    OR respondent_email = current_setting('app.current_user_email', true)
    OR auth.uid() IS NOT NULL
  )
)
WITH CHECK (
  status = 'in_progress'
  AND (
    respondent_email = current_setting('request.jwt.claims', true)::json->>'email'
    OR respondent_email = current_setting('app.current_user_email', true)
    OR auth.uid() IS NOT NULL
  )
);

-- Policy 4: Allow admins to do everything
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
