// ═══════════════════════════════════════════════════════════════════════
// WHY ATTEND CARD API - Individual Operations
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// GET - Fetch a single card by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const { data, error } = await supabase
      .from('why_attend_cards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching why_attend card:', error);
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Why attend GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update a card
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;
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
      .update({
        icon,
        title,
        description,
        color,
        sort_order,
        is_active
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating why_attend card:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update card' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Why attend PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a card
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const { error } = await supabase
      .from('why_attend_cards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting why_attend card:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete card' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Card deleted successfully'
    });
  } catch (error) {
    console.error('Why attend DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
