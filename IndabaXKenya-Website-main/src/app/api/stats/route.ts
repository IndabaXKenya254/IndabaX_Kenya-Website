export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - STATS/FUN FACTS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/stats - List active statistics
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'

export interface Stat {
  id: string
  label: string
  value: number
  suffix: string
  icon: string
  color: string
  display_order: number
  is_active: boolean
}

/**
 * GET /api/stats
 * Returns active stats ordered by display_order
 */
export async function GET() {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('stats')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Stats query error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<Stat[]> = {
      success: true,
      data: data || [],
      count: data?.length || 0,
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
  } catch (error) {
    return handleError(error)
  }
}
