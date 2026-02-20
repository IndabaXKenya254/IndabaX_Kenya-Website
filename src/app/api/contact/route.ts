export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - CONTACT FORM API
// ═══════════════════════════════════════════════════════════════════════
// POST /api/contact - Submit contact form message
// Created: Day 3 - Form Submission Endpoints

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleValidationError, handleDatabaseError } from '@/lib/api-errors'
import { validateBody, contactRequestSchema } from '@/lib/validations/api'
import type { ApiSuccessResponse, ContactSubmission } from '@/types/api'

/**
 * POST /api/contact
 * Submit a new contact form message
 *
 * Request Body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "subject": "Question about the event" (optional),
 *   "message": "I would like to know more about..."
 * }
 *
 * Returns:
 * - 201 Created: Successfully submitted message
 * - 400 Bad Request: Invalid input data
 * - 500 Internal Error: Database error
 *
 * Note: RLS policy allows public to insert contact submissions
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Validate request body
    const validation = await validateBody(contactRequestSchema, request)
    if (!validation.success) {
      return handleValidationError(validation.error)
    }

    const { name, email, subject, message } = validation.data

    // Insert into contact_submissions table
    const { data: newSubmission, error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        subject: subject || null,
        message,
        status: 'new',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Contact submission insert error:', insertError)
      return handleDatabaseError(insertError)
    }

    // Success - created new contact submission
    const response: ApiSuccessResponse<ContactSubmission> = {
      success: true,
      data: newSubmission as ContactSubmission,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
