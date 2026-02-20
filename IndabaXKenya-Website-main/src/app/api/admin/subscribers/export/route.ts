export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN SUBSCRIBERS EXPORT API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/subscribers/export - Export subscribers as CSV
// Created: Day 4 Phase 2 - Content Management

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'

/**
 * GET /api/admin/subscribers/export
 * Export all subscribers as CSV
 *
 * Query Parameters:
 * - format: 'csv' | 'json' (default: csv)
 *
 * Returns:
 * - CSV file download with all subscriber emails and timestamps
 * - OR JSON array if format=json
 */
export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { searchParams } = request.nextUrl
    const format = searchParams.get('format') || 'csv'

    // Fetch all subscribers
    const { data, error } = await supabase
      .from('subscribers')
      .select('email, subscribed_at')
      .order('subscribed_at', { ascending: false })

    if (error) {
      console.error('Subscribers fetch error:', error)
      return handleDatabaseError(error)
    }

    const subscribers = data || []

    // Return as JSON if requested
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: subscribers,
        count: subscribers.length,
      })
    }

    // Generate CSV
    const csvRows = [
      ['Email', 'Subscribed At'], // Header
      ...subscribers.map(sub => [
        sub.email,
        sub.subscribed_at || '',
      ])
    ]

    const csvContent = csvRows
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="indabax-subscribers-${new Date().toISOString().split('T')[0]}.csv"`,
        'X-Total-Count': subscribers.length.toString(),
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
