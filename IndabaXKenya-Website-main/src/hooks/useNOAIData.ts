// ═══════════════════════════════════════════════════════════════════════
// NOAI Data Hooks - Optimized with SWR for Fast Response
// ═══════════════════════════════════════════════════════════════════════
// Client-side caching, automatic revalidation, and optimistic updates

import useSWR from 'swr'

// Fetcher function with error handling
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    throw error
  }
  return res.json()
}

// SWR configuration for NOAI data
const swrConfig = {
  revalidateOnFocus: false, // Don't refetch on window focus
  revalidateOnReconnect: true, // Refetch on reconnect
  dedupingInterval: 10000, // Dedupe requests within 10 seconds
  focusThrottleInterval: 60000, // Throttle focus revalidation to 1 minute
}

// Hook for NOAI sections
export function useNOAISections() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/noai/sections',
    fetcher,
    {
      ...swrConfig,
      revalidateOnMount: true,
      refreshInterval: 300000, // Refresh every 5 minutes
    }
  )

  return {
    sections: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

// Hook for NOAI subsections
export function useNOAISubsections(parent?: string) {
  const url = parent ? `/api/noai/subsections?parent=${parent}` : '/api/noai/subsections'

  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      ...swrConfig,
      revalidateOnMount: true,
      refreshInterval: 300000, // Refresh every 5 minutes
    }
  )

  return {
    subsections: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

// Hook for NOAI participants
export function useNOAIParticipants(year?: number) {
  const url = year ? `/api/noai/participants?year=${year}` : '/api/noai/participants'

  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    {
      ...swrConfig,
      revalidateOnMount: true,
      refreshInterval: 600000, // Refresh every 10 minutes (participants change less frequently)
    }
  )

  return {
    participants: data?.data || {},
    count: data?.count || 0,
    isLoading,
    isError: error,
    mutate,
  }
}

// Hook for NOAI FAQs
export function useNOAIFAQs() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/noai/faqs',
    fetcher,
    {
      ...swrConfig,
      revalidateOnMount: true,
      refreshInterval: 600000, // Refresh every 10 minutes
    }
  )

  return {
    faqs: data?.data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

// Hook for NOAI current event
export function useNOAICurrentEvent() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/events/noai/current',
    fetcher,
    {
      ...swrConfig,
      revalidateOnMount: true,
      refreshInterval: 3600000, // Refresh every 1 hour (events change rarely)
    }
  )

  return {
    event: data?.event || null,
    isLoading,
    isError: error,
    mutate,
  }
}
