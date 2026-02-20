-- ═══════════════════════════════════════════════════════════════════════
-- PHASE 4: REGISTRATION FLOW - EVENT TEMPLATE ASSIGNMENT
-- ═══════════════════════════════════════════════════════════════════════
-- Add template assignment columns to events table
-- Migration Date: 2025-11-20

-- Add template assignment columns to events
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS initial_template_id UUID REFERENCES public.form_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS detailed_template_id UUID REFERENCES public.form_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS registration_enabled BOOLEAN DEFAULT TRUE NOT NULL,
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;

-- Add comments
COMMENT ON COLUMN public.events.initial_template_id IS 'Form template for initial interest registration';
COMMENT ON COLUMN public.events.detailed_template_id IS 'Form template for detailed survey (after shortlisting)';
COMMENT ON COLUMN public.events.registration_enabled IS 'Whether registration is currently open for this event';
COMMENT ON COLUMN public.events.registration_deadline IS 'Registration closes at this time';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_initial_template ON public.events(initial_template_id);
CREATE INDEX IF NOT EXISTS idx_events_detailed_template ON public.events(detailed_template_id);
CREATE INDEX IF NOT EXISTS idx_events_registration_enabled ON public.events(registration_enabled);
