// ═══════════════════════════════════════════════════════════════════════
// WHY ATTEND CARDS API
// ═══════════════════════════════════════════════════════════════════════
// Issue #44: Backend-managed "Why Choose IndabaX Kenya" section

import { NextResponse } from 'next/server';
import { createPublicClient, createAdminClient } from '@/lib/supabase';

export interface WhyAttendCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// GET - Fetch all active why_attend cards (public)
export async function GET() {
  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('why_attend_cards')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching why_attend cards:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch cards' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Why attend API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new why_attend card (admin only)
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { icon, title, description, color, sort_order, is_active } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('why_attend_cards')
      .insert({
        icon: icon || 'icofont-star',
        title,
        description,
        color: color || '#006700',
        sort_order: sort_order ?? 0,
        is_active: is_active ?? true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating why_attend card:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create card' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Why attend POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
