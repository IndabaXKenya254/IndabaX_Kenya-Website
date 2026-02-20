export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - ADMIN SPEAKERS API
// ═══════════════════════════════════════════════════════════════════════
// GET /api/admin/speakers - List all speakers
// POST /api/admin/speakers - Create new speaker
// Created: Day 4 Phase 2 - Content Management

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase'
import { handleError, handleDatabaseError, handleValidationError } from '@/lib/api-errors'
import { requireAdmin } from '@/lib/middleware/admin'
import { createSpeakerSchema } from '@/lib/validations/admin'
import type { ApiSuccessResponse, Speaker } from '@/types/api'

// Helper to invalidate all speaker-related caches
function invalidateSpeakerCache() {
  revalidatePath('/speakers')
  revalidatePath('/api/speakers')
  revalidatePath('/admin/speakers')
}

/**
 * GET /api/admin/speakers
 * List all speakers for admin
 *
 * Query Parameters:
 * - is_featured: 'true' | 'false' (optional)
 * - limit: number (default: 50, max: 200)
 * - offset: number (default: 0)
 * - include: 'expertise' (optional, comma-separated)
 */
export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()
    const { searchParams } = request.nextUrl

    // Parse query parameters
    const isFeatured = searchParams.get('is_featured')
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('speakers')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (isFeatured === 'true') {
      query = query.eq('is_featured', true)
    } else if (isFeatured === 'false') {
      query = query.eq('is_featured', false)
    }

    // Apply search filter (search in name, organization, title, bio_short)
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,organization.ilike.%${search}%,title.ilike.%${search}%,bio_short.ilike.%${search}%`)
    }

    // Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('Speakers list error:', error)
      return handleDatabaseError(error)
    }

    const speakers = data || []

    // Optionally include relationships (query param: include=expertise)
    const include = searchParams.get('include')
    const includeExpertise = include?.includes('expertise')

    // Fetch expertise for all speakers (if requested)
    if (includeExpertise && speakers.length > 0) {
      const speakerIds = speakers.map(s => s.id)
      const { data: expertiseData } = await supabase
        .from('speaker_expertise_relations')
        .select('speaker_id, expertise:speaker_expertise(id, name, slug)')
        .in('speaker_id', speakerIds)

      // Group expertise by speaker_id
      const expertiseBySpeaker = expertiseData?.reduce((acc: any, item: any) => {
        if (!acc[item.speaker_id]) acc[item.speaker_id] = []
        acc[item.speaker_id].push(item.expertise)
        return acc
      }, {}) || {}

      // Attach expertise to speakers
      speakers.forEach((speaker: any) => {
        speaker.expertise = expertiseBySpeaker[speaker.id] || []
      })
    }

    const response: ApiSuccessResponse<Speaker[]> = {
      success: true,
      data: speakers as Speaker[],
      count: count || 0,
    }

    const headers = new Headers()
    if (count !== null) {
      headers.set('X-Total-Count', count.toString())
    }

    return NextResponse.json(response, { status: 200, headers })
  } catch (error) {
    return handleError(error)
  }
}

/**
 * POST /api/admin/speakers
 * Create a new speaker
 *
 * Request Body:
 * {
 *   "name": "Dr. Jane Doe",
 *   "title": "AI Research Scientist" (optional),
 *   "organization": "Google Research" (optional),
 *   "country": "Kenya" (optional),
 *   "photo_url": "https://..." (optional),
 *   "bio_short": "Brief bio..." (optional),
 *   "bio_full": "Full biography..." (optional),
 *   "linkedin_url": "https://linkedin.com/in/..." (optional),
 *   "twitter_url": "https://twitter.com/..." (optional),
 *   "website_url": "https://..." (optional),
 *   "is_featured": true/false (default: false),
 *   "display_order": 0 (default: 0),
 *   "expertise_ids": ["uuid1", "uuid2"] (optional)
 * }
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request)
  if (authCheck.error) return authCheck.response

  try {
    const supabase = createServerClient()

    // Validate request body
    const body = await request.json()
    const validation = createSpeakerSchema.safeParse(body)

    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return handleValidationError(`${firstError.path.join('.')}: ${firstError.message}`)
    }

    // Extract relationships from validated data
    const { expertise_ids, event_ids, ...speakerData } = validation.data

    // Insert speaker
    const { data, error } = await supabase
      .from('speakers')
      .insert(speakerData)
      .select()
      .single()

    if (error) {
      console.error('Speaker insert error:', error)
      return handleDatabaseError(error)
    }

    // Insert speaker-expertise relationships (if provided)
    if (expertise_ids && expertise_ids.length > 0) {
      const expertiseRelations = expertise_ids.map(expertiseId => ({
        speaker_id: data.id,
        expertise_id: expertiseId,
      }))

      const { error: expertiseError } = await supabase
        .from('speaker_expertise_relations')
        .insert(expertiseRelations)

      if (expertiseError) {
        console.error('Expertise relations insert error:', expertiseError)
        // Non-critical - speaker still created
      }
    }

    // Insert speaker-event relationships (if provided)
    if (event_ids && event_ids.length > 0) {
      const eventRelations = event_ids.map((eventId, index) => ({
        event_id: eventId,
        speaker_id: data.id,
        display_order: index,
      }))

      const { error: eventError } = await supabase
        .from('event_speakers')
        .insert(eventRelations)

      if (eventError) {
        console.error('Event relations insert error:', eventError)
        // Non-critical - speaker still created
      }
    }

    // Invalidate speaker caches after successful creation
    invalidateSpeakerCache()

    const response: ApiSuccessResponse<Speaker> = {
      success: true,
      data: data as Speaker,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
