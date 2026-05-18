export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// NOAI ARCHIVES API - LIST & CREATE
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// GET - List all archives
export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('noai_archives')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching archives:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET archives:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new archive
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createAdminClient()

    // Generate slug from title if not provided
    let slug = body.slug
    if (!slug && body.title) {
      slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    }

    const archiveData = {
      slug,
      title: body.title,
      subtitle: body.subtitle || null,
      year: body.year || null,
      description: body.description || null,
      featured_image: body.featured_image || null,
      content_sections: body.content_sections || [],
      is_published: body.is_published ?? true,
      display_order: body.display_order ?? 0,
    }

    const { data, error } = await supabase
      .from('noai_archives')
      .insert(archiveData)
      .select()
      .single()

    if (error) {
      console.error('Error creating archive:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in POST archive:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
