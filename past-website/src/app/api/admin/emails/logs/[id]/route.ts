export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SINGLE EMAIL LOG API (PHASE 7 - DAY 3)
// ═══════════════════════════════════════════════════════════════════════
// Fetch a single email log by ID

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'

/**
 * GET /api/admin/emails/logs/[id]
 * Get a single email log by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Fetch the email log with related data
    const { data: log, error } = await supabase
      .from('email_logs')
      .select(`
        id,
        from_email,
        recipient_email,
        recipient_name,
        cc_emails,
        bcc_emails,
        subject,
        body,
        status,
        error_message,
        attempts,
        sent_at,
        delivered_at,
        created_at,
        updated_at,
        template_id,
        variables_used,
        sent_by,
        event_id,
        registration_id,
        email_templates (
          id,
          name,
          subject
        ),
        user_profiles!sent_by (
          id,
          name,
          email
        ),
        events (
          id,
          title
        ),
        registrations (
          id,
          user_id
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Email log not found' },
          { status: 404 }
        )
      }
      console.error('Failed to fetch email log:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch email log' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: log
    })
  } catch (error) {
    console.error('Email log fetch error:', error)
    return handleError(error)
  }
}
