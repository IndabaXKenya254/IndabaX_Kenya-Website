// ═══════════════════════════════════════════════════════════════════════
// PUBLIC API - CTA SECTION
// ═══════════════════════════════════════════════════════════════════════
// Fetch CTA section content for the homepage

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('settings')
      .select('value')
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
      data: data?.value || defaultValue
    });
  } catch (error) {
    console.error('CTA section API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
