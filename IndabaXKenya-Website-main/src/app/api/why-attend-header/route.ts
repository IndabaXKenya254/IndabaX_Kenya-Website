// ═══════════════════════════════════════════════════════════════════════
// PUBLIC API - WHY ATTEND SECTION HEADER
// ═══════════════════════════════════════════════════════════════════════
// Fetch header content for the Why Choose IndabaX section

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'why_attend_header')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching why_attend_header:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch header' },
        { status: 500 }
      );
    }

    // Return default values if not set
    const defaultValue = {
      subtitle: 'Why Attend',
      title: 'Why Choose IndabaX Kenya',
      description: 'IndabaX Kenya offers unparalleled opportunities for learning, networking, and advancing your AI career. Here\'s what makes our conference unique.',
      button_text: 'Register for IndabaX',
      button_link: '/register',
      is_visible: true
    };

    return NextResponse.json({
      success: true,
      data: data?.value || defaultValue
    });
  } catch (error) {
    console.error('why_attend_header API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
