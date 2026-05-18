// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REACT QUERY API HOOKS
// ═══════════════════════════════════════════════════════════════════════
// Custom hooks for all API endpoints with automatic caching and deduplication
// Benefits:
// - No duplicate API calls (multiple components using same hook = 1 request)
// - Automatic caching (data shared across components)
// - Loading and error states built-in
// - Automatic retries on failure

"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  Speaker,
  Sponsor,
  Stat,
  Event,
  Post,
  PricingTier,
  Setting,
  ApiResponse,
} from "@/types/api";

// ═══════════════════════════════════════════════════════════════════════
// GENERIC FETCH HELPER
// ═══════════════════════════════════════════════════════════════════════

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const result: ApiResponse<T> = await response.json();

  if (!result.success) {
    throw new Error(result.error.message || "API request failed");
  }

  return result.data;
}

// ═══════════════════════════════════════════════════════════════════════
// SETTINGS HOOKS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Fetch all settings (global)
 * Used by: SettingsContext
 * Returns: Flat object with settings (not array)
 */
export function useSettingsData() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => fetchApi<Record<string, any>>("/api/settings"),
    staleTime: 5 * 60 * 1000, // 5 minutes - settings don't change often
  });
}

/**
 * Fetch banner settings
 * Used by: MainBanner
 */
export function useBannerSettings() {
  return useQuery({
    queryKey: ["settings", "banner"],
    queryFn: () => fetchApi<Setting>("/api/settings/banner"),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch popup settings
 * Used by: RegistrationPopup
 */
export function usePopupSettings() {
  return useQuery({
    queryKey: ["settings", "popup"],
    queryFn: () => fetchApi<Setting>("/api/settings/popup"),
    staleTime: 0, // No stale time - always refetch to ensure admin toggles reflect immediately
    gcTime: 10 * 1000, // Garbage collect after 10 seconds
  });
}

// ═══════════════════════════════════════════════════════════════════════
// SPEAKERS HOOK
// ═══════════════════════════════════════════════════════════════════════

/**
 * Fetch speakers
 * Used by: Speakers component
 */
export function useSpeakers(limit?: number) {
  return useQuery({
    queryKey: ["speakers", limit],
    queryFn: () => fetchApi<Speaker[]>("/api/speakers"),
    staleTime: 10 * 60 * 1000, // 10 minutes
    select: (data) => (limit ? data.slice(0, limit) : data),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// SPONSORS HOOK
// ═══════════════════════════════════════════════════════════════════════

/**
 * Fetch sponsors
 * Used by: Partner component
 */
export function useSponsors() {
  return useQuery({
    queryKey: ["sponsors"],
    queryFn: () => fetchApi<Sponsor[]>("/api/sponsors"),
    staleTime: 10 * 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// STATS HOOK
// ═══════════════════════════════════════════════════════════════════════

/**
 * Fetch stats
 * Used by: FunFact component
 */
export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => fetchApi<Stat[]>("/api/stats"),
    staleTime: 5 * 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// EVENTS HOOKS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Fetch events with filters
 * Used by: UpcomingEvents, EventSchedules
 */
export function useEvents(params?: {
  type?: "upcoming" | "past";
  limit?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.type) queryParams.set("type", params.type);
  if (params?.limit) queryParams.set("limit", params.limit.toString());

  const endpoint = `/api/events${queryParams.toString() ? `?${queryParams}` : ""}`;

  return useQuery({
    queryKey: ["events", params],
    queryFn: () => fetchApi<Event[]>(endpoint),
    staleTime: 5 * 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// POSTS HOOK
// ═══════════════════════════════════════════════════════════════════════

/**
 * Fetch posts (news/blog)
 * Used by: LatestNews component
 */
export function usePosts(limit?: number) {
  const endpoint = limit ? `/api/posts?limit=${limit}` : "/api/posts";

  return useQuery({
    queryKey: ["posts", limit],
    queryFn: () => fetchApi<Post[]>(endpoint),
    staleTime: 5 * 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// PRICING HOOK
// ═══════════════════════════════════════════════════════════════════════

/**
 * Fetch pricing tiers
 * Used by: Pricing component
 */
export function usePricing() {
  return useQuery({
    queryKey: ["pricing"],
    queryFn: () => fetchApi<PricingTier[]>("/api/pricing"),
    staleTime: 10 * 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// SCHEDULE ITEMS HOOK
// ═══════════════════════════════════════════════════════════════════════

/**
 * Fetch schedule items
 * Used by: EventSchedules component
 */
export function useScheduleItems(eventId?: string) {
  const endpoint = eventId
    ? `/api/schedule-items?event_id=${eventId}`
    : "/api/schedule-items";

  return useQuery({
    queryKey: ["schedule-items", eventId],
    queryFn: () => fetchApi<any>(endpoint),
    staleTime: 10 * 60 * 1000,
  });
}
