// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - REACT QUERY PROVIDER
// ═══════════════════════════════════════════════════════════════════════
// Provides React Query client for efficient data fetching and caching
// Benefits:
// - Automatic request deduplication (no duplicate API calls)
// - Smart caching (data persists across components)
// - Automatic background revalidation
// - Better performance in dev and production

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create QueryClient once per app lifecycle
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data stays fresh for 60 seconds
            staleTime: 60 * 1000,
            // Cache data for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Retry failed requests once
            retry: 1,
            // Refetch on window focus (user returns to tab)
            refetchOnWindowFocus: false,
            // Refetch on network reconnect
            refetchOnReconnect: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
