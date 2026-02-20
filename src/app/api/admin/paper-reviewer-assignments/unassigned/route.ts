// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - UNASSIGNED PAPERS API
// ═══════════════════════════════════════════════════════════════════════
// Get papers that haven't been assigned to any reviewer yet

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'event_id is required' },
        { status: 400 }
      )
    }

    // Get all submitted papers for the event
    const { data: allPapers, error: papersError } = await supabase
      .from('papers')
      .select(`
        id,
        title,
        abstract,
        keywords,
        status,
        submitted_at,
        user_id
      `)
      .eq('event_id', eventId)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: true })

    if (papersError) throw papersError

    // Get all assignments for this event
    const { data: assignments } = await supabase
      .from('paper_reviewer_assignments')
      .select('paper_id')
      .eq('event_id', eventId)

    const assignedIds = new Set((assignments || []).map((a: { paper_id: string }) => a.paper_id))
    const unassignedPapers = (allPapers || []).filter((p: { id: string }) => !assignedIds.has(p.id))

    // Fetch author info from user_profiles
    const authorIds = Array.from(new Set(unassignedPapers.map((p: any) => p.user_id).filter(Boolean)))
    let authorMap = new Map()

    if (authorIds.length > 0) {
      const { data: authors } = await supabase
        .from('user_profiles')
        .select('id, name, email')
        .in('id', authorIds)

      authorMap = new Map((authors || []).map((a: any) => [a.id, a]))
    }

    // Merge author info into papers
    const papersWithAuthors = unassignedPapers.map((paper: any) => ({
      ...paper,
      user_profiles: authorMap.get(paper.user_id) || null
    }))

    return NextResponse.json({
      success: true,
      data: papersWithAuthors,
      total: papersWithAuthors.length
    })
  } catch (error) {
    console.error('Error fetching unassigned papers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch unassigned papers' },
      { status: 500 }
    )
  }
}
