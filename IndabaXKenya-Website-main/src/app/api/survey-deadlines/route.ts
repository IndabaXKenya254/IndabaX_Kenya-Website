export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SURVEY DEADLINE EXTENSION API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/survey-deadlines - List pending surveys with deadlines
// PATCH /api/survey-deadlines - Extend deadline for specific user
// Phase 5: Form System - Per-User Deadline Extension

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'

/**
 * GET /api/survey-deadlines?event_id=xxx
 * List all pending surveys with their deadlines
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const status = searchParams.get('status') || 'in_progress'

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    // Build query
    let query = supabase
      .from('form_responses')
      .select(`
        id,
        response_type,
        status,
        deadline_at,
        started_at,
        last_saved_at,
        completion_percentage,
        user_id,
        event_id,
        user_profiles:user_id (id, name, email),
        events:event_id (id, title, slug)
      `)
      .eq('response_type', 'detailed_survey')
      .order('deadline_at', { ascending: true, nullsFirst: false })

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Survey deadlines query error:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    })
  } catch (error) {
    console.error('Survey deadlines API error:', error)
    return handleError(error)
  }
}

/**
 * PATCH /api/survey-deadlines
 * Extend deadline for a specific survey
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { response_id, new_deadline, extend_days } = body

    // Validate input
    if (!response_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'response_id is required' } },
        { status: 400 }
      )
    }

    if (!new_deadline && !extend_days) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Either new_deadline or extend_days is required' } },
        { status: 400 }
      )
    }

    // Get current response
    const { data: currentResponse, error: fetchError } = await supabase
      .from('form_responses')
      .select('id, deadline_at')
      .eq('id', response_id)
      .single()

    if (fetchError || !currentResponse) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Survey response not found' } },
        { status: 404 }
      )
    }

    // Calculate new deadline
    let deadlineDate: Date

    if (new_deadline) {
      deadlineDate = new Date(new_deadline)
    } else if (extend_days) {
      const baseDate = currentResponse.deadline_at
        ? new Date(currentResponse.deadline_at)
        : new Date()
      deadlineDate = new Date(baseDate)
      deadlineDate.setDate(deadlineDate.getDate() + extend_days)
    } else {
      // Default: extend by 7 days from now
      deadlineDate = new Date()
      deadlineDate.setDate(deadlineDate.getDate() + 7)
    }

    // Update deadline
    const { data, error } = await supabase
      .from('form_responses')
      .update({
        deadline_at: deadlineDate.toISOString()
      })
      .eq('id', response_id)
      .select(`
        id,
        deadline_at,
        user_profiles:user_id (id, name, email),
        events:event_id (id, title)
      `)
      .single()

    if (error) {
      console.error('Deadline update error:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: `Deadline extended to ${deadlineDate.toLocaleDateString()}`
    })
  } catch (error) {
    console.error('Deadline extension API error:', error)
    return handleError(error)
  }
}

/**
 * POST /api/survey-deadlines/bulk
 * Bulk extend deadlines for multiple surveys
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!adminRole) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { response_ids, new_deadline, extend_days } = body

    // Validate input
    if (!response_ids || !Array.isArray(response_ids) || response_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'response_ids array is required' } },
        { status: 400 }
      )
    }

    if (!new_deadline && !extend_days) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Either new_deadline or extend_days is required' } },
        { status: 400 }
      )
    }

    // Calculate new deadline
    let deadlineDate: Date

    if (new_deadline) {
      deadlineDate = new Date(new_deadline)
    } else {
      // Extend by specified days from now
      deadlineDate = new Date()
      deadlineDate.setDate(deadlineDate.getDate() + (extend_days || 7))
    }

    // Update all deadlines
    const { data, error } = await supabase
      .from('form_responses')
      .update({
        deadline_at: deadlineDate.toISOString()
      })
      .in('id', response_ids)
      .select('id')

    if (error) {
      console.error('Bulk deadline update error:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: `Extended deadline for ${data?.length || 0} surveys to ${deadlineDate.toLocaleDateString()}`,
      count: data?.length || 0
    })
  } catch (error) {
    console.error('Bulk deadline extension API error:', error)
    return handleError(error)
  }
}
