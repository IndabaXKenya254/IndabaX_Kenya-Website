export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN SINGLE RESPONSE API
// ═══════════════════════════════════════════════════════════════════════
// Admin endpoint to view/update single form response

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'

/**
 * GET /api/admin/responses/[id]
 * Get single form response with full details (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    // Get response with all details
    const { data: response, error: fetchError } = await supabase
      .from('form_responses')
      .select(`
        *,
        event:events(
          id,
          slug,
          title,
          description,
          start_date,
          end_date,
          location,
          venue
        ),
        template:form_templates(
          id,
          name,
          description
        ),
        user_profile:user_profiles(
          id,
          email,
          full_name
        )
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !response) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Response not found' } },
        { status: 404 }
      )
    }

    // Get questions for this template
    const { data: questions } = await supabase
      .from('form_questions')
      .select('*')
      .eq('template_id', response.template_id)
      .order('order_index', { ascending: true })

    return NextResponse.json(
      {
        success: true,
        data: {
          ...response,
          questions: questions || [],
        },
      },
      { status: 200 }
    )
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/admin/responses/[id]
 * Update response status or add admin notes (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status, admin_notes } = body

    // Update response
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (status) updates.status = status
    if (admin_notes !== undefined) updates.admin_notes = admin_notes

    const { data, error: updateError } = await supabase
      .from('form_responses')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update response' } },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    )
  } catch (error) {
    return handleError(error)
  }
}
