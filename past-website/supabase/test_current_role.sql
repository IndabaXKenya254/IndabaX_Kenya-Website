-- Check what role the connection is using
SELECT current_user, current_role, session_user;

-- Check if this is considered an anon user
SELECT
  current_user as current_user,
  auth.uid() as auth_uid,
  auth.role() as auth_role;
