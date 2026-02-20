export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// ADMIN API: Email Recipients - Single Item Operations
// ═══════════════════════════════════════════════════════════════════════
// Update and delete individual email recipients
// Created: December 28, 2025
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// Create admin client for database operations
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// Check if user is admin
async function isAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const adminClient = createAdminClient()
    const { data: adminRole } = await adminClient
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    return !!adminRole
  } catch {
    return false
  }
}

// GET - Get single email recipient
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('email_recipients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching email recipient:', error)
      return NextResponse.json(
        { success: false, error: 'Email recipient not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET /api/admin/email-recipients/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update email recipient
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { email, name, recipient_type, email_category, is_active } = body

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    const supabase = createAdminClient()

    const updateData: Record<string, unknown> = {}
    if (email !== undefined) updateData.email = email.toLowerCase().trim()
    if (name !== undefined) updateData.name = name?.trim() || null
    if (recipient_type !== undefined) updateData.recipient_type = recipient_type
    if (email_category !== undefined) updateData.email_category = email_category
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabase
      .from('email_recipients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating email recipient:', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'This email already exists for this type and category' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to update email recipient' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in PUT /api/admin/email-recipients/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete email recipient
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('email_recipients')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting email recipient:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete email recipient' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Email recipient deleted' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/email-recipients/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
