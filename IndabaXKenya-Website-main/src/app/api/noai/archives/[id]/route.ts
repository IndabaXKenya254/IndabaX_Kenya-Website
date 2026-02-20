export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// NOAI ARCHIVES API - GET, UPDATE, DELETE BY ID
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

interface RouteParams {
  params: { id: string }
}

// GET - Get single archive
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('noai_archives')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching archive:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET archive:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update archive
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    const supabase = createAdminClient()

    // Generate slug from title if title changed and no custom slug
    let slug = body.slug
    if (!slug && body.title) {
      slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    }

    const updateData = {
      slug,
      title: body.title,
      subtitle: body.subtitle || null,
      year: body.year || null,
      description: body.description || null,
      featured_image: body.featured_image || null,
      content_sections: body.content_sections || [],
      is_published: body.is_published ?? true,
      display_order: body.display_order ?? 0,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('noai_archives')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating archive:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in PUT archive:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete archive
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('noai_archives')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting archive:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE archive:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
