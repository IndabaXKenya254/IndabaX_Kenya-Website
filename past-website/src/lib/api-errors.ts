// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - API ERROR HANDLING UTILITIES
// ═══════════════════════════════════════════════════════════════════════
// Centralized error handling for all API endpoints
// Created: Day 2 - Public API Endpoints

import { NextResponse } from 'next/server'
import type { ApiErrorResponse, ErrorCode } from '@/types/api'

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  statusCode: number = 500,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  }

  return NextResponse.json(response, { status: statusCode })
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error('Database error:', error)

  // Check if it's a Supabase error with specific message
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: string }).message

    // Handle specific error cases
    if (message.includes('relation') || message.includes('does not exist')) {
      return createErrorResponse(
        'DATABASE_ERROR',
        'Database table not found. Please ensure schema is created.',
        500,
        { hint: 'Run database migration' }
      )
    }

    if (message.includes('duplicate key')) {
      return createErrorResponse('DUPLICATE_ENTRY', 'Record already exists', 409)
    }

    if (message.includes('foreign key')) {
      return createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid reference. Related record does not exist.',
        400
      )
    }
  }

  // Generic database error
  return createErrorResponse('DATABASE_ERROR', 'Failed to query database', 500)
}

/**
 * Handle not found errors
 */
export function handleNotFound(resourceName: string = 'Resource'): NextResponse<ApiErrorResponse> {
  return createErrorResponse('NOT_FOUND', `${resourceName} not found`, 404)
}

/**
 * Handle validation errors
 */
export function handleValidationError(
  message: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return createErrorResponse('VALIDATION_ERROR', message, 400, details)
}

/**
 * Handle internal server errors
 */
export function handleInternalError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error('Internal error:', error)

  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred'

  return createErrorResponse('INTERNAL_ERROR', message, 500)
}

/**
 * Handle unauthorized errors
 */
export function handleUnauthorized(message: string = 'Authentication required'): NextResponse<ApiErrorResponse> {
  return createErrorResponse('UNAUTHORIZED', message, 401)
}

/**
 * Handle forbidden errors
 */
export function handleForbidden(message: string = 'Access denied'): NextResponse<ApiErrorResponse> {
  return createErrorResponse('FORBIDDEN', message, 403)
}

/**
 * Generic error handler - automatically routes to specific handlers
 */
export function handleError(error: unknown): NextResponse<ApiErrorResponse> {
  // Handle ApiError instances
  if (error instanceof ApiError) {
    return createErrorResponse(error.code, error.message, error.statusCode, error.details)
  }

  // Handle Supabase/database errors
  if (error && typeof error === 'object' && 'code' in error) {
    return handleDatabaseError(error)
  }

  // Handle generic errors
  return handleInternalError(error)
}
