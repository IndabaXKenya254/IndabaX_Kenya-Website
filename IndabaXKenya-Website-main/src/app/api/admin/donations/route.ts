// ═══════════════════════════════════════════════════════════════════════
// ADMIN API - DONATIONS MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════
// Main route for GET (all data) with query params for different types
// GET /api/admin/donations - returns all data: content, paymentMethods, whyCards, impactCards
// GET /api/admin/donations?type=content - returns only content sections
// GET /api/admin/donations?type=payment_methods - returns only payment methods
// GET /api/admin/donations?type=why_cards - returns only why cards
// GET /api/admin/donations?type=impact_cards - returns only impact cards
// ═══════════════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// GET - Fetch all donations data or specific type based on query params
export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // If a specific type is requested, return only that data
    if (type) {
      switch (type) {
        case 'content': {
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
        }

        case 'payment_methods': {
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
        }

        case 'why_cards': {
          const { data, error } = await supabase
            .from('donations_why_cards')
            .select('*')
            .order('display_order', { ascending: true });

          if (error) {
            console.error('Error fetching why cards:', error);
            return NextResponse.json(
              { success: false, error: 'Failed to fetch why cards' },
              { status: 500 }
            );
          }

          return NextResponse.json({
            success: true,
            data: data || []
          });
        }

        case 'impact_cards': {
          const { data, error } = await supabase
            .from('donations_impact_cards')
            .select('*')
            .order('display_order', { ascending: true });

          if (error) {
            console.error('Error fetching impact cards:', error);
            return NextResponse.json(
              { success: false, error: 'Failed to fetch impact cards' },
              { status: 500 }
            );
          }

          return NextResponse.json({
            success: true,
            data: data || []
          });
        }

        default:
          return NextResponse.json(
            { success: false, error: 'Invalid type parameter. Valid types: content, payment_methods, why_cards, impact_cards' },
            { status: 400 }
          );
      }
    }

    // No type specified - return all data
    const [contentResult, paymentMethodsResult, whyCardsResult, impactCardsResult] = await Promise.all([
      supabase
        .from('donations_content')
        .select('*')
        .order('display_order', { ascending: true }),
      supabase
        .from('payment_methods')
        .select('*')
        .order('display_order', { ascending: true }),
      supabase
        .from('donations_why_cards')
        .select('*')
        .order('display_order', { ascending: true }),
      supabase
        .from('donations_impact_cards')
        .select('*')
        .order('display_order', { ascending: true })
    ]);

    // Check for errors
    if (contentResult.error) {
      console.error('Error fetching donations content:', contentResult.error);
    }
    if (paymentMethodsResult.error) {
      console.error('Error fetching payment methods:', paymentMethodsResult.error);
    }
    if (whyCardsResult.error) {
      console.error('Error fetching why cards:', whyCardsResult.error);
    }
    if (impactCardsResult.error) {
      console.error('Error fetching impact cards:', impactCardsResult.error);
    }

    return NextResponse.json({
      success: true,
      data: {
        content: contentResult.data || [],
        paymentMethods: paymentMethodsResult.data || [],
        whyCards: whyCardsResult.data || [],
        impactCards: impactCardsResult.data || []
      }
    });
  } catch (error) {
    console.error('Admin donations API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
