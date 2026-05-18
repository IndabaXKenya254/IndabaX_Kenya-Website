export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * DELETE /api/admin/admins/[id] - Remove admin access
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Delete from admin_roles
    const { error } = await supabaseAdmin
      .from('admin_roles')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: { id }
    })
  } catch (error: any) {
    console.error('Error deleting admin:', error)
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || 'Failed to remove admin access' }
      },
      { status: 500 }
    )
  }
}
