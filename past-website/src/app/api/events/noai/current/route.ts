export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 600; // Cache for 10 minutes

export async function GET() {
  try {
    const supabase = await createClient();

    // Query the current/upcoming NOAI event
    const { data, error } = await supabase
      .from('events')
      .select(`
        id, slug, title, description,
        start_date, end_date, location, venue,
        featured_image, status, event_type,
        registration_enabled, registration_deadline,
        application_form_url, initial_template_id, detailed_template_id,
        max_attendees, event_category, event_year
      `)
      .eq('event_category', 'noai')
      .eq('status', 'upcoming')
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[API] NOAI event query error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: error.message,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'No upcoming NOAI event found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        },
      }
    );
  } catch (error) {
    console.error('[API] Error fetching current NOAI event:', error);
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
