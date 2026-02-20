// ═══════════════════════════════════════════════════════════════════════
// ADMIN API - DONATIONS CONTENT SECTIONS
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// GET - Fetch all content sections
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('donations_content')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching donations content:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Admin donations content API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new content section
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const {
      section_key,
      title,
      subtitle,
      description,
      button_text,
      button_link,
      icon,
      display_order,
      is_visible
    } = body;

    // Validate required fields
    if (!section_key || !title) {
      return NextResponse.json(
        { success: false, error: 'Section key and title are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('donations_content')
      .insert({
        section_key,
        title,
        subtitle: subtitle || null,
        description: description || null,
        button_text: button_text || null,
        button_link: button_link || null,
        icon: icon || null,
        display_order: display_order ?? 0,
        is_visible: is_visible ?? true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating donations content:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create content section' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Admin donations content POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
