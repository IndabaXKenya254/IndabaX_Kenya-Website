export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// OPTIMIZED REGISTRATION FORM API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/forms/registration/[slug] - Get complete registration form in ONE call
// Uses database function for optimal performance
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Admin client for RPC calls
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RouteParams {
  params: Promise<{ slug: string }>
}

/**
 * GET /api/forms/registration/[slug]
 *
 * Fetches complete registration form data in a single optimized query:
 * - Event details
 * - Form template
 * - All questions (ordered)
 * - Existing response (if user email provided)
 *
 * Query params:
 * - email: User's email to check for existing registration
 * - resume_token: Resume token for continuing a saved form
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const resumeToken = searchParams.get('resume_token')

    // Try to get user from session
    const supabase = createPublicClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userEmail = email || user?.email || null

    // Call optimized database function
    const { data, error } = await supabaseAdmin.rpc('get_registration_form', {
      p_event_slug: slug,
      p_user_email: userEmail
    })

    if (error) {
      console.error('Error fetching registration form:', error)
      return NextResponse.json(
        { success: false, error: { message: 'Failed to load registration form' } },
        { status: 500 }
      )
    }

    // Handle resume token lookup separately if provided and no existing response found
    if (resumeToken && (!data?.data?.existing_response)) {
      const { data: resumeData, error: resumeError } = await supabaseAdmin
        .from('form_responses')
        .select('id, status, responses, resume_token, last_saved_at')
        .eq('event_id', data?.data?.event?.id)
        .eq('resume_token', resumeToken)
        .eq('response_type', 'initial_interest')
        .single()

      if (!resumeError && resumeData) {
        data.data.existing_response = resumeData
      }
    }

    // Check if form/event is valid
    if (!data?.success) {
      return NextResponse.json(
        { success: false, error: { message: data?.error || 'Event not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Registration form API error:', error)
    return NextResponse.json(
      { success: false, error: { message: 'An error occurred' } },
      { status: 500 }
    )
  }
}
