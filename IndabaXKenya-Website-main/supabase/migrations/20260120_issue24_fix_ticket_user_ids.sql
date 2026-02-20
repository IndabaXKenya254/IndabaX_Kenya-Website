-- Issue #24: Fix tickets with wrong user_id
-- Problem: 87.5% of tickets have admin's user_id instead of attendee's user_id
-- Solution: Update user_id to match the user_profile with matching attendee_email

-- Fix existing tickets by matching attendee_email to correct user_id
-- Note: user_profiles uses 'id' column, not 'user_id'
UPDATE tickets
SET user_id = user_profiles.id
FROM user_profiles
WHERE LOWER(tickets.attendee_email) = LOWER(user_profiles.email)
AND tickets.user_id != user_profiles.id;

-- Verify the fix (run this query after to check results)
-- SELECT
--   t.ticket_number,
--   t.attendee_email,
--   t.user_id as ticket_user_id,
--   up.email as profile_email,
--   CASE WHEN t.user_id = up.user_id THEN 'MATCH' ELSE 'MISMATCH' END as status
-- FROM tickets t
-- LEFT JOIN user_profiles up ON LOWER(t.attendee_email) = LOWER(up.email);
