// ═══════════════════════════════════════════════════════════════════════
// ADMIN API - DONATIONS IMPACT CARD - Individual Operations
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// GET - Fetch a single impact card by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const { data, error } = await supabase
      .from('donations_impact_cards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching donations impact card:', error);
      return NextResponse.json(
        { success: false, error: 'Impact card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Admin donations impact card GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update an impact card
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
      .update({
        title,
        description,
        image_url,
        display_order,
        is_visible
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating donations impact card:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update impact card' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Admin donations impact card PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an impact card
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const { error } = await supabase
      .from('donations_impact_cards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting donations impact card:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete impact card' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Impact card deleted successfully'
    });
  } catch (error) {
    console.error('Admin donations impact card DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
