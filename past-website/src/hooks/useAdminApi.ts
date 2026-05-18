// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REACT QUERY ADMIN HOOKS
// ═══════════════════════════════════════════════════════════════════════
// Custom hooks for all admin API endpoints with automatic caching and deduplication
// Replaces old useState + useEffect + useRef pattern

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiResponse } from "@/types/api";

// ═══════════════════════════════════════════════════════════════════════
// GENERIC FETCH HELPERS
// ═══════════════════════════════════════════════════════════════════════

async function fetchAdminApi<T>(endpoint: string): Promise<T> {
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

async function mutateAdminApi<T>(
  endpoint: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: any
): Promise<T> {
  const response = await fetch(endpoint, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

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
// QUERY HELPERS (for building query strings)
// ═══════════════════════════════════════════════════════════════════════

function buildQueryString(params: Record<string, any>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD HOOKS
// ═══════════════════════════════════════════════════════════════════════

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: async () => {
      // Fetch counts from multiple endpoints
      const [posts, events, speakers, sponsors, applications, subscribers] =
        await Promise.all([
          fetchAdminApi<any[]>("/api/admin/posts"),
          fetchAdminApi<any[]>("/api/admin/events"),
          fetchAdminApi<any[]>("/api/admin/speakers"),
          fetchAdminApi<any[]>("/api/admin/sponsors"),
          fetchAdminApi<any[]>("/api/admin/applications"),
          fetchAdminApi<any[]>("/api/admin/subscribers"),
        ]);

      return {
        totalPosts: posts.length,
        totalEvents: events.length,
        totalSpeakers: speakers.length,
        totalSponsors: sponsors.length,
        totalApplications: applications.length,
        totalSubscribers: subscribers.length,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ═══════════════════════════════════════════════════════════════════════
// SPEAKERS HOOKS
// ═══════════════════════════════════════════════════════════════════════

interface SpeakerFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

export function useAdminSpeakers(filters: SpeakerFilters = {}) {
  const queryString = buildQueryString(filters);
  return useQuery({
    queryKey: ["admin", "speakers", filters],
    queryFn: () => fetchAdminApi<any[]>(`/api/admin/speakers${queryString}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminSpeaker(id: string | null) {
  return useQuery({
    queryKey: ["admin", "speaker", id],
    queryFn: () => fetchAdminApi<any>(`/api/admin/speakers/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteSpeaker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateAdminApi(`/api/admin/speakers/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "speakers"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// SPONSORS HOOKS
// ═══════════════════════════════════════════════════════════════════════

interface SponsorFilters {
  search?: string;
  tier?: string;
  limit?: number;
  offset?: number;
}

export function useAdminSponsors(filters: SponsorFilters = {}) {
  const queryString = buildQueryString(filters);
  return useQuery({
    queryKey: ["admin", "sponsors", filters],
    queryFn: () => fetchAdminApi<any[]>(`/api/admin/sponsors${queryString}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminSponsor(id: string | null) {
  return useQuery({
    queryKey: ["admin", "sponsor", id],
    queryFn: () => fetchAdminApi<any>(`/api/admin/sponsors/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteSponsor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateAdminApi(`/api/admin/sponsors/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "sponsors"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// POSTS HOOKS
// ═══════════════════════════════════════════════════════════════════════

interface PostFilters {
  search?: string;
  status?: string;
  category?: string;
  post_type?: string;
  limit?: number;
  offset?: number;
}

export function useAdminPosts(filters: PostFilters = {}) {
  const queryString = buildQueryString(filters);
  return useQuery({
    queryKey: ["admin", "posts", filters],
    queryFn: () => fetchAdminApi<any[]>(`/api/admin/posts${queryString}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminPost(id: string | null) {
  return useQuery({
    queryKey: ["admin", "post", id],
    queryFn: () => fetchAdminApi<any>(`/api/admin/posts/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateAdminApi(`/api/admin/posts/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// EVENTS HOOKS
// ═══════════════════════════════════════════════════════════════════════

interface EventFilters {
  search?: string;
  status?: string;
  event_type?: string;
  venue_id?: string;
  limit?: number;
  offset?: number;
  include_deleted?: boolean;  // Issue #17, #19: Include soft-deleted events
}

export function useAdminEvents(filters: EventFilters = {}) {
  const queryString = buildQueryString(filters);
  return useQuery({
    queryKey: ["admin", "events", filters],
    queryFn: () => fetchAdminApi<any[]>(`/api/admin/events${queryString}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminEvent(id: string | null) {
  return useQuery({
    queryKey: ["admin", "event", id],
    queryFn: () => fetchAdminApi<any>(`/api/admin/events/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateAdminApi(`/api/admin/events/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// APPLICATIONS HOOKS
// ═══════════════════════════════════════════════════════════════════════

interface ApplicationFilters {
  status?: string;
  limit?: number;
  offset?: number;
}

export function useAdminApplications(filters: ApplicationFilters = {}) {
  const queryString = buildQueryString(filters);
  return useQuery({
    queryKey: ["admin", "applications", filters],
    queryFn: () =>
      fetchAdminApi<any[]>(`/api/admin/applications${queryString}`),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAdminApplication(id: string | null) {
  return useQuery({
    queryKey: ["admin", "application", id],
    queryFn: () => fetchAdminApi<any>(`/api/admin/applications/${id}`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      mutateAdminApi(`/api/admin/applications/${id}`, "PUT", { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "applications"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// SUBSCRIBERS HOOKS
// ═══════════════════════════════════════════════════════════════════════

export function useAdminSubscribers() {
  return useQuery({
    queryKey: ["admin", "subscribers"],
    queryFn: () => fetchAdminApi<any[]>("/api/admin/subscribers"),
    staleTime: 5 * 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// GALLERY/PHOTOS HOOKS
// ═══════════════════════════════════════════════════════════════════════

interface PhotoFilters {
  search?: string;
  year?: string;
  is_featured?: boolean;
  limit?: number;
  offset?: number;
}

export function useAdminPhotos(filters: PhotoFilters = {}) {
  const queryString = buildQueryString(filters);
  return useQuery({
    queryKey: ["admin", "photos", filters],
    queryFn: () => fetchAdminApi<any[]>(`/api/admin/photos${queryString}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeletePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateAdminApi(`/api/admin/photos/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "photos"] });
    },
  });
}

export function useUpdatePhotoFeatured() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_featured }: { id: string; is_featured: boolean }) =>
      mutateAdminApi(`/api/admin/photos/${id}`, "PUT", { is_featured }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "photos"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// SETTINGS HOOKS
// ═══════════════════════════════════════════════════════════════════════

export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => fetchAdminApi<any[]>("/api/admin/settings"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      mutateAdminApi(`/api/admin/settings/${key}`, "PUT", { value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      // Also invalidate public settings
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// FAQS HOOKS
// ═══════════════════════════════════════════════════════════════════════

interface FAQFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

export function useAdminFAQs(filters: FAQFilters = {}) {
  const queryString = buildQueryString(filters);
  return useQuery({
    queryKey: ["admin", "faqs", filters],
    queryFn: () => fetchAdminApi<any[]>(`/api/admin/faqs${queryString}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminFAQ(id: string | null) {
  return useQuery({
    queryKey: ["admin", "faq", id],
    queryFn: () => fetchAdminApi<any>(`/api/admin/faqs/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteFAQ() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateAdminApi(`/api/admin/faqs/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// STATS HOOKS
// ═══════════════════════════════════════════════════════════════════════

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => fetchAdminApi<any[]>("/api/admin/stats"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteStat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateAdminApi(`/api/admin/stats/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      // Also invalidate public stats
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// PRICING HOOKS
// ═══════════════════════════════════════════════════════════════════════

export function useAdminPricing() {
  return useQuery({
    queryKey: ["admin", "pricing"],
    queryFn: () => fetchAdminApi<any[]>("/api/admin/pricing"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeletePricingTier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateAdminApi(`/api/admin/pricing/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pricing"] });
      // Also invalidate public pricing
      queryClient.invalidateQueries({ queryKey: ["pricing"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// SCHEDULE HOOKS
// ═══════════════════════════════════════════════════════════════════════

interface ScheduleFilters {
  search?: string;
  event_id?: string;
  limit?: number;
  offset?: number;
}

export function useAdminSchedules(filters: ScheduleFilters = {}) {
  const queryString = buildQueryString(filters);
  return useQuery({
    queryKey: ["admin", "schedules", filters],
    queryFn: () => fetchAdminApi<any[]>(`/api/admin/schedules${queryString}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateAdminApi(`/api/admin/schedules/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "schedules"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// TAGS HOOKS
// ═══════════════════════════════════════════════════════════════════════

export function useAdminEventTags() {
  return useQuery({
    queryKey: ["admin", "tags", "events"],
    queryFn: () => fetchAdminApi<any[]>("/api/admin/tags/events"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminPostTags() {
  return useQuery({
    queryKey: ["admin", "tags", "posts"],
    queryFn: () => fetchAdminApi<any[]>("/api/admin/tags/posts"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id }: { type: "events" | "posts"; id: string }) =>
      mutateAdminApi(`/api/admin/tags/${type}/${id}`, "DELETE"),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "tags", variables.type],
      });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// EXPERTISE HOOKS
// ═══════════════════════════════════════════════════════════════════════

interface ExpertiseFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

export function useAdminExpertise(filters: ExpertiseFilters = {}) {
  const queryString = buildQueryString(filters);
  return useQuery({
    queryKey: ["admin", "expertise", filters],
    queryFn: () => fetchAdminApi<any[]>(`/api/admin/expertise${queryString}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteExpertise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateAdminApi(`/api/admin/expertise/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "expertise"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// TEAM HOOKS
// ═══════════════════════════════════════════════════════════════════════

interface TeamFilters {
  search?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

export function useAdminTeam(filters: TeamFilters = {}) {
  const queryString = buildQueryString(filters);
  return useQuery({
    queryKey: ["admin", "team", filters],
    queryFn: () => fetchAdminApi<any[]>(`/api/admin/team${queryString}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateAdminApi(`/api/admin/team?id=${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "team"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// VENUES HOOKS
// ═══════════════════════════════════════════════════════════════════════

interface VenueFilters {
  search?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

export function useAdminVenues(filters: VenueFilters = {}) {
  const queryString = buildQueryString(filters);
  return useQuery({
    queryKey: ["admin", "venues", filters],
    queryFn: () => fetchAdminApi<any[]>(`/api/admin/venues${queryString}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateAdminApi(`/api/admin/venues?id=${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "venues"] });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// CONTACT SUBMISSIONS HOOKS
// ═══════════════════════════════════════════════════════════════════════

interface ContactSubmissionFilters {
  status?: string;
  limit?: number;
  offset?: number;
}

export function useAdminContactSubmissions(
  filters: ContactSubmissionFilters = {}
) {
  const queryString = buildQueryString(filters);
  return useQuery({
    queryKey: ["admin", "contact-submissions", filters],
    queryFn: () =>
      fetchAdminApi<any[]>(`/api/admin/contact-submissions${queryString}`),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateContactSubmissionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      mutateAdminApi(`/api/admin/contact-submissions/${id}/status`, "PUT", {
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "contact-submissions"],
      });
    },
  });
}

export function useDeleteContactSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      mutateAdminApi(`/api/admin/contact-submissions/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "contact-submissions"],
      });
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// ADMINS HOOKS
// ═══════════════════════════════════════════════════════════════════════

export function useAdminAdmins() {
  return useQuery({
    queryKey: ["admin", "admins"],
    queryFn: () => fetchAdminApi<any[]>("/api/admin/admins"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, deleteUser = true }: { userId: string; deleteUser?: boolean }) =>
      mutateAdminApi(`/api/admin/admins?userId=${userId}&deleteUser=${deleteUser}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
    },
  });
}
