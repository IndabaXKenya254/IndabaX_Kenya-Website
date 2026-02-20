export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - BULK REJECT API (PHASE 5)
// ═══════════════════════════════════════════════════════════════════════
// Reject multiple applications at once

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'

interface BulkRejectRequest {
  application_ids: string[]
}

interface BulkResult {
  total: number
  success: number
  failed: number
  results: Array<{
    application_id: string
    success: boolean
    error?: string
  }>
}

/**
 * POST /api/admin/applications/bulk/reject
 * Reject multiple registrations at once
 *
 * Body:
 * {
 *   application_ids: ["uuid1", "uuid2", "uuid3"]
 * }
 *
 * Process:
 * - Validates all registration IDs
 * - Processes in batches of 10
 * - Updates status to 'rejected' for each
 * - Returns detailed results
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 1. Parse request body
    // ═══════════════════════════════════════════════════════════════════

    const body: BulkRejectRequest = await request.json()

    if (!body.application_ids || !Array.isArray(body.application_ids)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: application_ids must be an array' },
        { status: 400 }
      )
    }

    if (body.application_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No applications selected' },
        { status: 400 }
      )
    }

    if (body.application_ids.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Maximum 100 applications can be rejected at once' },
        { status: 400 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. Fetch all applications (from form_responses table)
    // ═══════════════════════════════════════════════════════════════════

    const { data: applications, error: fetchError } = await supabase
      .from('form_responses')
      .select(`
        id,
        event_id,
        respondent_name,
        respondent_email,
        status_v2,
        events (
          id,
          title,
          slug,
          start_date
        )
      `)
      .in('id', body.application_ids)

    if (fetchError) {
      console.error('Failed to fetch applications:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No applications found' },
        { status: 404 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. Process each application
    // ═══════════════════════════════════════════════════════════════════

    const results: BulkResult = {
      total: applications.length,
      success: 0,
      failed: 0,
      results: []
    }

    const now = new Date().toISOString()

    // Process in batches of 10 to avoid overwhelming the system
    const batchSize = 10
    for (let i = 0; i < applications.length; i += batchSize) {
      const batch = applications.slice(i, i + batchSize)

      // Process batch in parallel
      await Promise.all(
        batch.map(async (application) => {
          try {
            // Skip if already rejected
            if (application.status_v2 === 'rejected') {
              results.results.push({
                application_id: application.id,
                success: false,
                error: 'Already rejected'
              })
              results.failed++
              return
            }

            // Update status in form_responses table
            const { error: updateError } = await supabase
              .from('form_responses')
              .update({
                status_v2: 'rejected',
                rejected_by: user.id,
                rejected_at: now,
                decision_at: now,
                decision_by: user.id,
                reviewed_at: now,
                reviewed_by: user.id
              })
              .eq('id', application.id)

            if (updateError) {
              console.error('Update error:', updateError)
              throw new Error('Failed to update status')
            }

            // Note: No email is sent for rejections (per requirements)
            // Rejected applicants are not notified via email

            results.results.push({
              application_id: application.id,
              success: true
            })
            results.success++
          } catch (error) {
            console.error(`Failed to reject application ${application.id}:`, error)
            results.results.push({
              application_id: application.id,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
            results.failed++
          }
        })
      )
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. Return results
    // ═══════════════════════════════════════════════════════════════════

    return NextResponse.json({
      success: true,
      message: `Rejected ${results.success} of ${results.total} applications`,
      data: results
    })
  } catch (error) {
    console.error('Bulk reject error:', error)
    return handleError(error)
  }
}
