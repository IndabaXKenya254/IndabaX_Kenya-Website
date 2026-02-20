// ═══════════════════════════════════════════════════════════════════════
// TEST EMAIL TEMPLATE CACHE PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════
// Demonstrates the performance improvement from caching

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import {
  getTemplateByName,
  preloadTemplates,
  clearTemplateCache,
  getCacheStats,
  TEMPLATE_NAMES
} from '../src/lib/email/template-service'

async function measureTime<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; timeMs: number }> {
  const start = performance.now()
  const result = await fn()
  const timeMs = performance.now() - start
  return { result, timeMs }
}

async function runPerformanceTest() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  EMAIL TEMPLATE CACHE PERFORMANCE TEST')
  console.log('═══════════════════════════════════════════════════════════════\n')

  const templateName = TEMPLATE_NAMES.EMAIL_VERIFICATION

  // Test 1: Cold fetch (no cache)
  console.log('🔹 Test 1: Cold Fetch (no cache)')
  clearTemplateCache()

  const cold = await measureTime('Cold fetch', () => getTemplateByName(templateName))
  console.log(`   Time: ${cold.timeMs.toFixed(2)}ms`)
  console.log(`   Template found: ${cold.result?.name || 'NOT FOUND'}\n`)

  // Test 2: Warm fetch (from cache)
  console.log('🔹 Test 2: Warm Fetch (from cache)')
  const warm = await measureTime('Warm fetch', () => getTemplateByName(templateName))
  console.log(`   Time: ${warm.timeMs.toFixed(2)}ms`)
  console.log(`   Speedup: ${(cold.timeMs / warm.timeMs).toFixed(1)}x faster\n`)

  // Test 3: Preload all templates
  console.log('🔹 Test 3: Preload All Templates')
  clearTemplateCache()

  const preload = await measureTime('Preload all', () => preloadTemplates())
  console.log(`   Time: ${preload.timeMs.toFixed(2)}ms`)
  console.log(`   Templates preloaded: ${preload.result}`)

  const stats = getCacheStats()
  console.log(`   Cache stats: ${JSON.stringify(stats, null, 2)}\n`)

  // Test 4: Multiple template fetches after preload
  console.log('🔹 Test 4: Fetch 5 Different Templates After Preload')

  const templates = [
    TEMPLATE_NAMES.EMAIL_VERIFICATION,
    TEMPLATE_NAMES.WELCOME,
    TEMPLATE_NAMES.APPLICATION_RECEIVED,
    TEMPLATE_NAMES.PASSWORD_RESET,
    TEMPLATE_NAMES.ADMIN_INVITATION
  ]

  let totalTime = 0
  for (const name of templates) {
    const { timeMs } = await measureTime(name, () => getTemplateByName(name))
    totalTime += timeMs
    console.log(`   ${name}: ${timeMs.toFixed(2)}ms`)
  }
  console.log(`   Total: ${totalTime.toFixed(2)}ms`)
  console.log(`   Average: ${(totalTime / templates.length).toFixed(2)}ms per template\n`)

  // Test 5: Compare without cache
  console.log('🔹 Test 5: Same 5 Templates WITHOUT Cache')
  clearTemplateCache()

  let totalTimeNocache = 0
  for (const name of templates) {
    clearTemplateCache() // Clear before each to simulate no cache
    const { timeMs } = await measureTime(name, () => getTemplateByName(name))
    totalTimeNocache += timeMs
    console.log(`   ${name}: ${timeMs.toFixed(2)}ms`)
  }
  console.log(`   Total: ${totalTimeNocache.toFixed(2)}ms`)
  console.log(`   Average: ${(totalTimeNocache / templates.length).toFixed(2)}ms per template\n`)

  // Summary
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  SUMMARY')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`  With cache:    ${totalTime.toFixed(2)}ms total`)
  console.log(`  Without cache: ${totalTimeNocache.toFixed(2)}ms total`)
  console.log(`  Improvement:   ${((1 - totalTime/totalTimeNocache) * 100).toFixed(1)}% faster`)
  console.log(`  Speedup:       ${(totalTimeNocache / totalTime).toFixed(1)}x`)
  console.log('═══════════════════════════════════════════════════════════════\n')
}

runPerformanceTest().catch(console.error)
