export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PAPERS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/papers - List papers (admin/reviewer)
// POST /api/papers - Submit a new paper
// Phase 9: Paper Submission & Review

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'

/**
 * GET /api/papers?event_id=xxx
 * List all papers for an event (admin/reviewer only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const status = searchParams.get('status')

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Check if user is admin or reviewer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'reviewer'].includes(profile.role || '')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin or reviewer access required' } },
        { status: 403 }
      )
    }

    // Build query
    let query = supabase
      .from('papers')
      .select(`
        *,
        user_profiles:user_id (id, name, email),
        events:event_id (id, title, slug),
        reviewer:reviewed_by (id, name)
      `)
      .order('submitted_at', { ascending: false })

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Papers query error:', error)
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
    console.error('Papers API error:', error)
    return handleError(error)
  }
}

/**
 * POST /api/papers
 * Submit a new paper
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

    const body = await request.json()
    const { event_id, registration_id, title, abstract, keywords, paper_url, supplementary_files } = body

    // Validate required fields
    if (!event_id || !title || !abstract || !paper_url) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'event_id, title, abstract, and paper_url are required' } },
        { status: 400 }
      )
    }

    // Create paper
    const { data, error } = await supabase
      .from('papers')
      .insert({
        user_id: user.id,
        event_id,
        registration_id,
        title,
        abstract,
        keywords: keywords || [],
        paper_url,
        supplementary_files: supplementary_files || null,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Paper submission error:', error)
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Paper submitted successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Paper submission API error:', error)
    return handleError(error)
  }
}
