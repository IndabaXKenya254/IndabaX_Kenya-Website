export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SUPABASE CONNECTION TEST API
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = createServerClient()

    // Test the connection by fetching Supabase status
    const { data, error } = await supabase
      .from('_test_connection')
      .select('*')
      .limit(1)

    // Even if table doesn't exist, connection is successful if we get a proper error
    if (error) {
      // Check if it's a "table not found" error (connection successful)
      if (
        error.message.includes('relation') ||
        error.message.includes('does not exist') ||
        error.message.includes('table') ||
        error.message.includes('schema cache')
      ) {
        return NextResponse.json({
          success: true,
          connection: 'OK',
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          timestamp: new Date().toISOString(),
          note: 'Database is empty - ready for schema creation',
        })
      }

      // Other errors (authentication, network, etc.)
      return NextResponse.json({
        success: false,
        error: error.message,
        connection: 'FAILED',
      }, { status: 500 })
    }

    // Connection successful with data
    return NextResponse.json({
      success: true,
      connection: 'OK',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      connection: 'FAILED',
    }, { status: 500 })
  }
}
