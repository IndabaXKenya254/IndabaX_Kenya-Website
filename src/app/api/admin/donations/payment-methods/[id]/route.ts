// ═══════════════════════════════════════════════════════════════════════
// ADMIN API - DONATIONS PAYMENT METHOD - Individual Operations
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// GET - Fetch a single payment method by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching payment method:', error);
      return NextResponse.json(
        { success: false, error: 'Payment method not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Admin payment method GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update a payment method
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;
    const body = await request.json();

    const {
      name,
      description,
      icon,
      payment_type,
      payment_details,
      instructions,
      is_enabled,
      display_order
    } = body;

    // Validate required fields
    if (!name || !payment_type) {
      return NextResponse.json(
        { success: false, error: 'Name and payment type are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .update({
        name,
        description,
        icon,
        payment_type,
        payment_details,
        instructions,
        is_enabled,
        display_order
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment method:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update payment method' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Admin payment method PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a payment method
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { id } = params;

    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting payment method:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete payment method' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    console.error('Admin payment method DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
