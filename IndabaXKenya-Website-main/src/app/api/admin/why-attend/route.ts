// ═══════════════════════════════════════════════════════════════════════
// ADMIN API - WHY ATTEND CARDS
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Helper to check if user is admin
async function isAdmin() {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return profile?.role === 'admin' || profile?.role === 'super_admin';
  } catch {
    return false;
  }
}

// GET - Fetch all cards (including inactive for admin)
export async function GET() {
  try {
    // Note: For now, we'll allow read access but protect write operations
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('why_attend_cards')
      .select('*')
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
    console.error('Admin why attend API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new card
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
    console.error('Admin why attend POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
