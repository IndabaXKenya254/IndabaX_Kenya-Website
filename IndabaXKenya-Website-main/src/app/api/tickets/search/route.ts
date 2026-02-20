export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TICKET SEARCH API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/tickets/search?q=name&event_id=xxx - Search tickets by attendee name
// Admin-only endpoint for check-in functionality
// ═══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get admin user session
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Admin authentication required',
        },
        { status: 401 }
      );
    }

    // Verify admin role using user_profiles table
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const isReviewer = profile?.role === 'reviewer';

    if (!isAdmin && !isReviewer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Admin or reviewer access required',
        },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('q');
    const eventId = searchParams.get('event_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Validate search query
    if (!search || search.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'Search term must be at least 2 characters',
        },
        { status: 400 }
      );
    }

    // Build query using admin client to bypass RLS
    // Search by name OR email for better results
    const adminSupabase = createAdminClient();

    let query = adminSupabase
      .from('tickets')
      .select('id, ticket_number, attendee_name, attendee_email, status, event_id, created_at')
      .or(`attendee_name.ilike.%${search}%,attendee_email.ilike.%${search}%`)
      .limit(limit)
      .order('created_at', { ascending: false });

    // Apply event filter if provided
    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[API] Ticket search error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('[API] Error in ticket search:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
