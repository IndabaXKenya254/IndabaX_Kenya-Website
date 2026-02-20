-- Test direct insert to verify RLS policies work
-- Run this as the anon user in Supabase SQL Editor

-- First, set role to anon to simulate API request
SET ROLE anon;

-- Try inserting a test record
INSERT INTO public.applications (
  application_type,
  name,
  email,
  ticket_type,
  status
) VALUES (
  'registration',
  'SQL Test User',
  'sqltest@example.com',
  'general',
  'pending'
);

-- Reset role
RESET ROLE;

-- Check if it was inserted
SELECT * FROM public.applications WHERE email = 'sqltest@example.com';
