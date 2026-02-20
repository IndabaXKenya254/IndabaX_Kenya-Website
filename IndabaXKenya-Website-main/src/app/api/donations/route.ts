// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PUBLIC DONATIONS API
// ═══════════════════════════════════════════════════════════════════════
// Issue #20: Public API for donations page content
// Returns only visible/enabled content
// ═══════════════════════════════════════════════════════════════════════

import { createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  // Use admin client to bypass RLS - we filter by is_visible/is_enabled anyway
  const supabase = createAdminClient()

  try {
    // Fetch all visible content in parallel
    const [contentRes, paymentRes, whyRes, impactRes] = await Promise.all([
      supabase
        .from('donations_content')
        .select('*')
        .eq('is_visible', true)
        .order('display_order'),
      supabase
        .from('payment_methods')
        .select('*')
        .eq('is_enabled', true)
        .order('display_order'),
      supabase
        .from('donations_why_cards')
        .select('*')
        .eq('is_visible', true)
        .order('display_order'),
      supabase
        .from('donations_impact_cards')
        .select('*')
        .eq('is_visible', true)
        .order('display_order'),
    ])

    // Check for errors
    if (contentRes.error) {
      console.error('Error fetching donations_content:', contentRes.error)
    }
    if (paymentRes.error) {
      console.error('Error fetching payment_methods:', paymentRes.error)
    }
    if (whyRes.error) {
      console.error('Error fetching donations_why_cards:', whyRes.error)
    }
    if (impactRes.error) {
      console.error('Error fetching donations_impact_cards:', impactRes.error)
    }

    // Convert content array to keyed object
    const contentMap: Record<string, any> = {}
    if (contentRes.data) {
      contentRes.data.forEach((item: { section_key: string; [key: string]: any }) => {
        contentMap[item.section_key] = item
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        content: contentMap,
        paymentMethods: paymentRes.data || [],
        whyCards: whyRes.data || [],
        impactCards: impactRes.data || [],
      }
    })
  } catch (error) {
    console.error('Error in donations API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
