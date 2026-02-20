-- Check if is_admin() function exists
SELECT
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'is_admin'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
