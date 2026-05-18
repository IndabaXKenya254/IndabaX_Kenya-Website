export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - NEWSLETTER SUBSCRIPTION API
// ═══════════════════════════════════════════════════════════════════════
// POST /api/subscribe - Subscribe to newsletter
// Created: Day 2 - Public API Endpoints

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import { validateBody, subscribeRequestSchema } from '@/lib/validations/api'
import type { ApiSuccessResponse, Subscriber } from '@/types/api'

/**
 * POST /api/subscribe
 * Subscribe an email address to the newsletter
 *
 * Request Body:
 * {
 *   "email": "user@example.com"
 * }
 *
 * Returns:
 * - 201 Created: Successfully subscribed
 * - 200 OK: Already subscribed (idempotent)
 * - 400 Bad Request: Invalid email
 * - 500 Internal Error: Database error
 *
 * Note: RLS policy allows public to insert into subscribers table
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Validate request body
    const validation = await validateBody(subscribeRequestSchema, request)
    if (!validation.success) {
      return handleValidationError(validation.error)
    }

    const { email } = validation.data

    // Check if email already exists
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, email, status')
      .eq('email', email)
      .maybeSingle() // Returns null if not found (no error)

    // If already subscribed and active, return success (idempotent)
    if (existing && existing.status === 'active') {
      const response: ApiSuccessResponse<Subscriber> = {
        success: true,
        data: existing as Subscriber,
      }
      return NextResponse.json(response, { status: 200 })
    }

    // If previously unsubscribed, reactivate
    if (existing && existing.status === 'unsubscribed') {
      const { data: updated, error: updateError } = await supabase
        .from('subscribers')
        .update({
          status: 'active',
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
        })
        .eq('email', email)
        .select()
        .single()

      if (updateError) {
        console.error('Subscriber reactivation error:', updateError)
        return handleDatabaseError(updateError)
      }

      const response: ApiSuccessResponse<Subscriber> = {
        success: true,
        data: updated as Subscriber,
      }
      return NextResponse.json(response, { status: 200 })
    }

    // New subscriber - insert
    const { data: newSubscriber, error: insertError } = await supabase
      .from('subscribers')
      .insert({
        email,
        status: 'active',
      })
      .select()
      .single()

    if (insertError) {
      // Check for duplicate key error (race condition)
      if (insertError.code === '23505') {
        // Duplicate - treat as success (idempotent)
        const { data: existing } = await supabase
          .from('subscribers')
          .select('*')
          .eq('email', email)
          .single()

        const response: ApiSuccessResponse<Subscriber> = {
          success: true,
          data: existing as Subscriber,
        }
        return NextResponse.json(response, { status: 200 })
      }

      console.error('Subscriber insert error:', insertError)
      return handleDatabaseError(insertError)
    }

    // Success - created new subscriber
    const response: ApiSuccessResponse<Subscriber> = {
      success: true,
      data: newSubscriber as Subscriber,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
