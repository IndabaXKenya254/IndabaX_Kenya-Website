// ═══════════════════════════════════════════════════════════════════════
// ADMIN API - DONATIONS WHY CARD - Individual Operations
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// GET - Fetch a single why card by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const { data, error } = await supabase
      .from('donations_why_cards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching donations why card:', error);
      return NextResponse.json(
        { success: false, error: 'Why card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Admin donations why card GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update a why card
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;
    const body = await request.json();

    const {
      title,
      description,
      icon,
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
      .from('donations_why_cards')
      .update({
        title,
        description,
        icon,
        image_url,
        display_order,
        is_visible
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating donations why card:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update why card' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Admin donations why card PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a why card
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const { error } = await supabase
      .from('donations_why_cards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting donations why card:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete why card' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Why card deleted successfully'
    });
  } catch (error) {
    console.error('Admin donations why card DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
