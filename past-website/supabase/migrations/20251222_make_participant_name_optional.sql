-- ═══════════════════════════════════════════════════════════════════════
-- Make participant name optional (allow NULL)
-- ═══════════════════════════════════════════════════════════════════════
-- Only year and photo_url are required

-- Make name column nullable
ALTER TABLE public.noai_participants
ALTER COLUMN name DROP NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.noai_participants.name IS 'Participant name (optional - only year and photo_url are required)';
