// ═══════════════════════════════════════════════════════════════════════
// ADMIN API - WHY ATTEND SECTION HEADER
// ═══════════════════════════════════════════════════════════════════════
// Issue #44: Admin-editable header for "Why Choose IndabaX Kenya" section

import { NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from '@/lib/supabase';

// GET - Fetch header content
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('settings')
      .select('value, updated_at')
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
      data: data?.value || defaultValue,
      updated_at: data?.updated_at || null
    });
  } catch (error) {
    console.error('Admin why_attend_header API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update header content
export async function PUT(request: Request) {
  try {
    const supabase = createServerClient();
    const adminClient = createAdminClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Upsert the header setting
    const { data, error } = await adminClient
      .from('settings')
      .upsert({
        key: 'why_attend_header',
        value: body,
        description: 'Header content for the Why Choose IndabaX section on the homepage',
        updated_at: new Date().toISOString(),
        updated_by: user.id
      }, {
        onConflict: 'key'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating why_attend_header:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update header' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data?.value
    });
  } catch (error) {
    console.error('Admin why_attend_header PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
