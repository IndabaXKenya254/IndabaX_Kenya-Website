// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - SUPABASE EXPORTS
// ═══════════════════════════════════════════════════════════════════════

// Export client and server Supabase instances
export { createClient as createBrowserClient } from './client'
export { createClient as createServerClient, createAdminClient } from './server'
export { createPublicClient } from './public'
export { updateSession } from './middleware'
