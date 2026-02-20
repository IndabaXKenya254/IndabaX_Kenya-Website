-- Test if is_admin() function works for anon users

-- Test as anon (no auth.uid())
SET ROLE anon;
SELECT is_admin() as is_admin_as_anon;
RESET ROLE;

-- Also check what auth.uid() returns for anon
SET ROLE anon;
SELECT auth.uid() as auth_uid_as_anon;
RESET ROLE;
