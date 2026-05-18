-- ═══════════════════════════════════════════════════════════════════════
-- PRODUCTION SQL #35b: CREATE TICKETS TABLE
-- ═══════════════════════════════════════════════════════════════════════
-- Date: 2025-12-14
-- Purpose: Create tickets table for event ticketing system
-- Run Order: AFTER 35_registration_redesign_phase1_to_5.sql
--            BEFORE 36_tickets_table_enhancements.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 1. CREATE TICKETS TABLE
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE NOT NULL,

  -- Ticket details
  ticket_number VARCHAR(50) UNIQUE NOT NULL, -- Format: EVENT-001234
  ticket_type VARCHAR(50), -- e.g., 'general', 'vip', 'speaker', 'organizer'
  qr_code_data TEXT NOT NULL, -- JSON: {ticketId, userId, eventId}
  pdf_url TEXT, -- Stored in Supabase Storage: tickets/[eventId]/[ticketId].pdf

  -- Attendee information (denormalized for ticket display)
  attendee_name VARCHAR(255) NOT NULL,
  attendee_email VARCHAR(255) NOT NULL,
  attendee_organization VARCHAR(255),

  -- Status
  is_valid BOOLEAN DEFAULT TRUE NOT NULL, -- Can be invalidated if needed

  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ═══════════════════════════════════════════════════════════════════════
-- 2. CREATE INDEXES
-- ═══════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_registration_id ON tickets(registration_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_attendee_email ON tickets(attendee_email);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. ENABLE RLS
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. CREATE RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Authenticated users can insert tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON tickets;

-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'reviewer')
    )
  );

-- Only authenticated users can insert tickets (typically via functions)
CREATE POLICY "Authenticated users can insert tickets"
  ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own tickets
CREATE POLICY "Users can update their own tickets"
  ON tickets
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can update all tickets
CREATE POLICY "Admins can update all tickets"
  ON tickets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'reviewer')
    )
  );

-- ═══════════════════════════════════════════════════════════════════════
-- 5. ADD COMMENTS
-- ═══════════════════════════════════════════════════════════════════════

COMMENT ON TABLE public.tickets IS
'Event tickets with QR codes and PDF generation support. Generated for approved applications.';

COMMENT ON COLUMN public.tickets.registration_id IS
'References registrations table. Will be updated to reference form_responses in migration 40.';

COMMENT ON COLUMN public.tickets.qr_code_data IS
'JSON data for QR code: {ticketId, userId, eventId}. Used for check-in verification.';

COMMENT ON COLUMN public.tickets.ticket_type IS
'Ticket type/tier: general, vip, speaker, organizer, etc.';

-- ═══════════════════════════════════════════════════════════════════════
-- SUCCESS MESSAGE
-- ═══════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PRODUCTION SQL #35b: Tickets Table Created';
  RAISE NOTICE '   Table: tickets';
  RAISE NOTICE '   Indexes: 5 indexes created';
  RAISE NOTICE '   RLS: Enabled with 5 policies';
  RAISE NOTICE '   ';
  RAISE NOTICE '   NEXT: Run migration 36 to add check-in columns';
  RAISE NOTICE '         Run migration 40 to fix foreign key to form_responses';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
