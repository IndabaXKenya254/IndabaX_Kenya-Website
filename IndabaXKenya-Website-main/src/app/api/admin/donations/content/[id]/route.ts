// ═══════════════════════════════════════════════════════════════════════
// ADMIN API - DONATIONS CONTENT SECTION - Individual Operations
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// GET - Fetch a single content section by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const { data, error } = await supabase
      .from('donations_content')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching donations content:', error);
      return NextResponse.json(
        { success: false, error: 'Content section not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Admin donations content GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update a content section
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;
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
      .update({
        section_key,
        title,
        subtitle,
        description,
        button_text,
        button_link,
        icon,
        display_order,
        is_visible
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating donations content:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update content section' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Admin donations content PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a content section
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const { error } = await supabase
      .from('donations_content')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting donations content:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete content section' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Content section deleted successfully'
    });
  } catch (error) {
    console.error('Admin donations content DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
