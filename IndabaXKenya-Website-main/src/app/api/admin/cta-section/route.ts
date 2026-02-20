// ═══════════════════════════════════════════════════════════════════════
// ADMIN API - CTA SECTION
// ═══════════════════════════════════════════════════════════════════════
// Issue #44: Admin-editable CTA section

import { NextResponse } from 'next/server';
import { createAdminClient, createServerClient } from '@/lib/supabase';

// GET - Fetch CTA section content
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('settings')
      .select('value, updated_at, updated_by')
      .eq('key', 'cta_section')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching CTA section:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch CTA section' },
        { status: 500 }
      );
    }

    // Return default values if not set
    const defaultValue = {
      badge_text: "Don't Miss Out!",
      heading: "Secure Your Spot at IndabaX Kenya",
      description: "Join 500+ AI enthusiasts from across Africa for 3 days of learning, networking, and innovation. Registration is FREE for students only. Limited seats available - register now to be part of East Africa's premier AI conference.",
      button_text: "Register Now",
      button_link: "/register",
      background_image: "/images/buy-tickets-bg.jpg",
      highlights: [
        { icon: "icofont-check-circled", text: "50+ Expert Speakers" },
        { icon: "icofont-check-circled", text: "10+ Hands-on Workshops" },
        { icon: "icofont-check-circled", text: "Networking with 500+ Attendees" },
        { icon: "icofont-check-circled", text: "FREE for Students Only" }
      ],
      is_visible: true
    };

    return NextResponse.json({
      success: true,
      data: data?.value || defaultValue,
      updated_at: data?.updated_at || null
    });
  } catch (error) {
    console.error('Admin CTA section API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update CTA section content
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
    if (!body.heading || !body.button_text) {
      return NextResponse.json(
        { success: false, error: 'Heading and button text are required' },
        { status: 400 }
      );
    }

    // Upsert the CTA section setting
    const { data, error } = await adminClient
      .from('settings')
      .upsert({
        key: 'cta_section',
        value: body,
        description: 'CTA section content for the homepage (Secure Your Spot section)',
        updated_at: new Date().toISOString(),
        updated_by: user.id
      }, {
        onConflict: 'key'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating CTA section:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update CTA section' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data?.value
    });
  } catch (error) {
    console.error('Admin CTA section PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
