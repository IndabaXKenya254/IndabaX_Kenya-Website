-- Test if contact_submissions table exists and is accessible
SELECT * FROM contact_submissions LIMIT 1;

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'contact_submissions'
ORDER BY ordinal_position;
