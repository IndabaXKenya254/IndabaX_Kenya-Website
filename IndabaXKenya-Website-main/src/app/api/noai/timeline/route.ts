export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// NOAI TIMELINE MILESTONES API - GET ALL / CREATE
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('noai_timeline_milestones')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching timeline milestones:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Timeline API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
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
      .insert({
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
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating timeline milestone:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Timeline API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
