export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - FORM TEMPLATES API (PHASE 5)
// ═══════════════════════════════════════════════════════════════════════
// Fetch available survey form templates for shortlist modal

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'

/**
 * GET /api/admin/form-templates
 * Fetch all form templates for admin use
 *
 * Query Parameters:
 * - usage_type: string (optional) - comma-separated list of usage types to filter by
 *   e.g., ?usage_type=detailed_survey,survey
 *
 * Returns:
 * {
 *   success: true,
 *   data: [
 *     {
 *       id: "uuid",
 *       name: "Post-Application Survey",
 *       description: "Follow-up survey for shortlisted applicants",
 *       usage_type: "detailed_survey",
 *       created_at: "2025-01-01T00:00:00Z"
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { searchParams } = request.nextUrl

    // Get optional usage_type filter
    const usageTypeFilter = searchParams.get('usage_type')

    // Build query
    let query = supabase
      .from('form_templates')
      .select(`
        id,
        name,
        description,
        usage_type,
        created_at
      `)
      .order('created_at', { ascending: false })

    // Apply usage_type filter if provided
    if (usageTypeFilter) {
      const types = usageTypeFilter.split(',').map(t => t.trim())
      if (types.length === 1) {
        query = query.eq('usage_type', types[0])
      } else if (types.length > 1) {
        query = query.in('usage_type', types)
      }
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Failed to fetch form templates:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch form templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: templates || []
    })
  } catch (error) {
    console.error('Form templates API error:', error)
    return handleError(error)
  }
}
