// ═══════════════════════════════════════════════════════════════════════
// ADMIN API - DONATIONS PAYMENT METHODS
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// GET - Fetch all payment methods
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching payment methods:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch payment methods' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Admin payment methods API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new payment method
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
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
      .insert({
        name,
        description: description || null,
        icon: icon || null,
        payment_type,
        payment_details: payment_details || {},
        instructions: instructions || null,
        is_enabled: is_enabled ?? true,
        display_order: display_order ?? 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment method:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create payment method' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Admin payment methods POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
