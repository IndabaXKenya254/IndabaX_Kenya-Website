export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PRICING TIERS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/pricing - List active pricing tiers
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError } from '@/lib/api-errors'
import type { ApiSuccessResponse } from '@/types/api'

export interface PricingTier {
  id: string
  title: string
  price: string
  currency: string
  period: string
  description: string | null
  featured: boolean
  badge: string | null
  features: string[]
  requirements: string[]
  button_text: string
  button_link: string
  display_order: number
  is_active: boolean
}

/**
 * GET /api/pricing
 * Returns active pricing tiers ordered by display_order
 */
export async function GET() {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('pricing_tiers')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Pricing tiers query error:', error)
      return handleDatabaseError(error)
    }

    const response: ApiSuccessResponse<PricingTier[]> = {
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
