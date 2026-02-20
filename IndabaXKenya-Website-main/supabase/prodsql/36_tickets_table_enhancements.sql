-- ═══════════════════════════════════════════════════════════════════════════
-- INDABAX KENYA - TICKETS TABLE (PHASE 8)
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Alter existing tickets table and add check-in functionality
-- Created: 2025-11-27
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ALTER EXISTING TICKETS TABLE (ADD MISSING COLUMNS IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════════════════

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'status'
  ) THEN
    ALTER TABLE tickets ADD COLUMN status VARCHAR(20) DEFAULT 'active'
      CHECK (status IN ('active', 'checked_in', 'cancelled', 'expired'));
  END IF;
END $$;

-- Add checked_in_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'checked_in_at'
  ) THEN
    ALTER TABLE tickets ADD COLUMN checked_in_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add checked_in_by column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'checked_in_by'
  ) THEN
    ALTER TABLE tickets ADD COLUMN checked_in_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add downloaded_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'downloaded_at'
  ) THEN
    ALTER TABLE tickets ADD COLUMN downloaded_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add download_count column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'download_count'
  ) THEN
    ALTER TABLE tickets ADD COLUMN download_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. CREATE INDEXES (IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code_data ON tickets(qr_code_data);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. CREATE CHECK-IN FUNCTION
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_in_ticket(
  p_ticket_id UUID,
  p_checked_in_by UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  ticket_data JSONB
) AS $$
DECLARE
  v_ticket RECORD;
BEGIN
  -- Get ticket
  SELECT * INTO v_ticket FROM tickets WHERE id = p_ticket_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Ticket not found'::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  -- Check status
  IF v_ticket.status = 'checked_in' THEN
    RETURN QUERY SELECT
      FALSE,
      'Ticket already checked in at ' || TO_CHAR(v_ticket.checked_in_at, 'YYYY-MM-DD HH24:MI'),
      TO_JSONB(v_ticket);
    RETURN;
  END IF;

  IF v_ticket.status = 'cancelled' THEN
    RETURN QUERY SELECT FALSE, 'Ticket has been cancelled'::TEXT, TO_JSONB(v_ticket);
    RETURN;
  END IF;

  IF v_ticket.status = 'expired' THEN
    RETURN QUERY SELECT FALSE, 'Ticket has expired'::TEXT, TO_JSONB(v_ticket);
    RETURN;
  END IF;

  -- Perform check-in
  UPDATE tickets
  SET
    status = 'checked_in',
    checked_in_at = NOW(),
    checked_in_by = p_checked_in_by,
    updated_at = NOW()
  WHERE id = p_ticket_id
  RETURNING * INTO v_ticket;

  RETURN QUERY SELECT TRUE, 'Check-in successful'::TEXT, TO_JSONB(v_ticket);
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. CREATE FUNCTION TO LOOK UP TICKET BY QR CODE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION lookup_ticket_by_qr(
  p_qr_data TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  ticket_data JSONB,
  event_data JSONB,
  attendee_data JSONB
) AS $$
DECLARE
  v_ticket RECORD;
  v_event RECORD;
BEGIN
  -- Find ticket by QR code data
  SELECT t.*, e.title as event_title, e.start_date, e.location
  INTO v_ticket
  FROM tickets t
  JOIN events e ON t.event_id = e.id
  WHERE t.qr_code_data = p_qr_data;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE,
      'Invalid QR code - ticket not found'::TEXT,
      NULL::JSONB,
      NULL::JSONB,
      NULL::JSONB;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    TRUE,
    'Ticket found'::TEXT,
    JSONB_BUILD_OBJECT(
      'id', v_ticket.id,
      'ticket_number', v_ticket.ticket_number,
      'status', v_ticket.status,
      'ticket_type', v_ticket.ticket_type,
      'checked_in_at', v_ticket.checked_in_at
    ),
    JSONB_BUILD_OBJECT(
      'id', v_ticket.event_id,
      'title', v_ticket.event_title,
      'start_date', v_ticket.start_date,
      'location', v_ticket.location
    ),
    JSONB_BUILD_OBJECT(
      'name', v_ticket.attendee_name,
      'email', v_ticket.attendee_email,
      'organization', v_ticket.attendee_organization
    );
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════════════════
