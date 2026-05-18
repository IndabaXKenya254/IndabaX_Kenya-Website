export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// NOAI TIMELINE MILESTONES API - GET/PUT/DELETE BY ID
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

interface RouteParams {
  params: { id: string }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('noai_timeline_milestones')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching milestone:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ success: false, error: 'Milestone not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Timeline API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    const { year, title, subtitle, date, icon, description, highlight, display_order, is_published, link_url, link_type } = body

    if (!year || !title || !subtitle || !date || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Ensure link_type is null when link_url is empty (data consistency)
    const finalLinkUrl = link_url || null
    const finalLinkType = finalLinkUrl ? (link_type || null) : null

    const { data, error } = await supabase
      .from('noai_timeline_milestones')
      .update({
        year,
        title,
        subtitle,
        date,
        icon: icon || 'icofont-calendar',
        description,
        highlight: highlight || null,
        display_order: display_order || 0,
        is_published: is_published !== false,
        link_url: finalLinkUrl,
        link_type: finalLinkType,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating milestone:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Timeline API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from('noai_timeline_milestones')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting milestone:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Timeline API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
