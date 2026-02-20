export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - INDIVIDUAL EMAIL TEMPLATE API (PHASE 7)
// ═══════════════════════════════════════════════════════════════════════
// Get, update, delete individual email template

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { invalidateTemplateById } from '@/lib/email/template-service'

// ═══════════════════════════════════════════════════════════════════════
// GET /api/email-templates/[id]
// Get a single email template
// ═══════════════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { id } = params

    const { data: template, error } = await supabase
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
      .eq('id', id)
      .single()

    if (error || !template) {
      return NextResponse.json(
        { success: false, error: 'Email template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: template
    })
  } catch (error) {
    console.error('Email template fetch error:', error)
    return handleError(error)
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PATCH /api/email-templates/[id]
// Update an email template
// ═══════════════════════════════════════════════════════════════════════

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { id } = params

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

    // Check if template exists and is not system template
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('email_templates')
      .select('is_system')
      .eq('id', id)
      .single()

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { success: false, error: 'Email template not found' },
        { status: 404 }
      )
    }

    if (existingTemplate.is_system) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify system templates' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, subject, bodyContent, description, category, variables, type, is_reusable } = body

    // Build update object (only include provided fields)
    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (subject !== undefined) updates.subject = subject
    if (bodyContent !== undefined) updates.body = bodyContent
    if (description !== undefined) updates.description = description
    if (category !== undefined) updates.category = category
    if (variables !== undefined) updates.variables = variables
    if (type !== undefined) updates.type = type
    if (is_reusable !== undefined) updates.is_reusable = is_reusable

    // Update template
    const { data: template, error } = await supabase
      .from('email_templates')
      .update(updates)
      .eq('id', id)
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
      console.error('Failed to update email template:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update email template' },
        { status: 500 }
      )
    }

    // Invalidate cache after successful update
    invalidateTemplateById(id)

    return NextResponse.json({
      success: true,
      message: 'Email template updated successfully',
      data: template
    })
  } catch (error) {
    console.error('Email template update error:', error)
    return handleError(error)
  }
}

// ═══════════════════════════════════════════════════════════════════════
// DELETE /api/email-templates/[id]
// Delete an email template
// ═══════════════════════════════════════════════════════════════════════

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { id } = params

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

    // Check if template exists and is not system template
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('email_templates')
      .select('is_system, name')
      .eq('id', id)
      .single()

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { success: false, error: 'Email template not found' },
        { status: 404 }
      )
    }

    if (existingTemplate.is_system) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete system templates' },
        { status: 403 }
      )
    }

    // Delete template
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete email template:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete email template' },
        { status: 500 }
      )
    }

    // Invalidate cache after successful delete
    invalidateTemplateById(id)

    return NextResponse.json({
      success: true,
      message: 'Email template deleted successfully'
    })
  } catch (error) {
    console.error('Email template deletion error:', error)
    return handleError(error)
  }
}
