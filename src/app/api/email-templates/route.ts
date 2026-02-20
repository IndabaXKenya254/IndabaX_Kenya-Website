export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EMAIL TEMPLATES API (PHASE 7)
// ═══════════════════════════════════════════════════════════════════════
// CRUD operations for email templates

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'

// ═══════════════════════════════════════════════════════════════════════
// GET /api/email-templates
// Get all email templates (with optional filtering)
// ═══════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)

    // Optional filters
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('email_templates')
      .select(`
        id,
        name,
        subject,
        body,
        description,
        type,
        category,
        is_reusable,
        is_system,
        variables,
        created_by,
        created_at,
        updated_at,
        user_profiles!email_templates_created_by_fkey (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (category) {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,subject.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Failed to fetch email templates:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch email templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: templates || []
    })
  } catch (error) {
    console.error('Email templates fetch error:', error)
    return handleError(error)
  }
}

// ═══════════════════════════════════════════════════════════════════════
// POST /api/email-templates
// Create a new email template
// ═══════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
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
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, subject, bodyContent, description, category, variables, type, is_reusable } = body

    // Validation
    if (!name || !subject || !bodyContent) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, subject, body' },
        { status: 400 }
      )
    }

    // Insert template
    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        name,
        subject,
        body: bodyContent,
        description: description || null,
        type: type || 'custom',
        category: category || null,
        is_reusable: is_reusable !== undefined ? is_reusable : true,
        is_system: false, // Only system can create system templates
        variables: variables || ['{{name}}', '{{email}}', '{{event_name}}'],
        created_by: user.id
      })
      .select(`
        id,
        name,
        subject,
        body,
        description,
        type,
        category,
        is_reusable,
        is_system,
        variables,
        created_by,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      console.error('Failed to create email template:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create email template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email template created successfully',
      data: template
    })
  } catch (error) {
    console.error('Email template creation error:', error)
    return handleError(error)
  }
}
