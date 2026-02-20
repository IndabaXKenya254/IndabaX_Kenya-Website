// ═══════════════════════════════════════════════════════════════════════
// SETTINGS UTILITY - No-Cache Fetching
// ═══════════════════════════════════════════════════════════════════════
// Fetches settings from Supabase WITHOUT caching to ensure fresh data
// Use this for critical settings like current_event_year
// ═══════════════════════════════════════════════════════════════════════

import { createPublicClient } from './public';

/**
 * Fetches a setting value from the database
 * Uses dynamic rendering when possible, falls back gracefully for static builds
 *
 * @param key - The setting key to fetch
 * @param defaultValue - Default value if setting not found
 * @returns The setting value or default
 */
export async function getSetting<T = string>(
  key: string,
  defaultValue: T
): Promise<T> {
  // Try to opt out of caching, but don't fail during static generation
  try {
    const { unstable_noStore: noStore } = await import('next/cache');
    noStore();
  } catch {
    // Ignore - this happens during static generation
  }

  try {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();

    const result = data as { value: any } | null;
    if (error || !result?.value) {
      console.warn(`[Settings] Could not fetch '${key}', using default:`, defaultValue);
      return defaultValue;
    }

    // Handle type conversion
    if (typeof defaultValue === 'number') {
      return Number(result.value) as T;
    }
    if (typeof defaultValue === 'boolean') {
      return (result.value === 'true' || result.value === true) as unknown as T;
    }

    return result.value as T;
  } catch (error) {
    console.error(`[Settings] Error fetching '${key}':`, error);
    return defaultValue;
  }
}

/**
 * Gets the current event year from settings
 * Defaults to next year if not set (safe default for history page)
 */
export async function getCurrentEventYear(): Promise<number> {
  const nextYear = new Date().getFullYear() + 1;
  return getSetting<number>('current_event_year', nextYear);
}
