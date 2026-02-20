// ═══════════════════════════════════════════════════════════════════════
// ADMIN API - DONATIONS IMPACT CARDS
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// GET - Fetch all impact cards
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('donations_impact_cards')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching donations impact cards:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch impact cards' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Admin donations impact cards API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new impact card
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const {
      title,
      description,
      image_url,
      display_order,
      is_visible
    } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('donations_impact_cards')
      .insert({
        title,
        description,
        image_url: image_url || null,
        display_order: display_order ?? 0,
        is_visible: is_visible ?? true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating donations impact card:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create impact card' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Admin donations impact cards POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
