export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// ADMIN API: Email Recipients (CC/BCC Management)
// ═══════════════════════════════════════════════════════════════════════
// Manage email recipients for CC/BCC on system emails
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

// GET - List all email recipients
export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('email_recipients')
      .select('*')
      .order('email_category', { ascending: true })
      .order('recipient_type', { ascending: true })
      .order('email', { ascending: true })

    if (error) {
      console.error('Error fetching email recipients:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch email recipients' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in GET /api/admin/email-recipients:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new email recipient
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, name, recipient_type, email_category, is_active } = body

    // Validate required fields
    if (!email || !recipient_type || !email_category) {
      return NextResponse.json(
        { success: false, error: 'Email, recipient type, and email category are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('email_recipients')
      .insert({
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        recipient_type,
        email_category,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating email recipient:', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'This email already exists for this type and category' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to create email recipient' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/email-recipients:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
