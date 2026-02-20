#!/usr/bin/env tsx

// ═══════════════════════════════════════════════════════════════════════
// FIX APPLICATION NAMES - Extract from Responses JSON
// ═══════════════════════════════════════════════════════════════════════
// This script updates existing applications to use the name from form
// submission instead of profile name
// ═══════════════════════════════════════════════════════════════════════

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Extract name from responses JSON using same logic as API
 */
function extractNameFromResponses(responses: Record<string, any>): string | null {
  // Check common field names that might contain the name
  const commonNameFields = [
    'name', 'full_name', 'fullName', 'full name',
    'Name', 'Full Name', 'FullName',
    'applicant_name', 'applicantName', 'participant_name', 'participantName'
  ]

  for (const field of commonNameFields) {
    // Check direct match in responses
    if (responses[field] && typeof responses[field] === 'string') {
      const extractedName = (responses[field] as string).trim()
      if (extractedName) {
        return extractedName
      }
    }
  }

  // Check for name in nested question IDs (UUID keys)
  for (const [key, value] of Object.entries(responses)) {
    if (typeof value === 'string' && value.trim()) {
      // Look for keys that contain 'name' in lowercase
      const lowerKey = key.toLowerCase()
      if (lowerKey.includes('name') && !lowerKey.includes('username') && !lowerKey.includes('filename')) {
        const extractedName = value.trim()
        if (extractedName.length > 2 && extractedName.length < 100) { // Reasonable name length
          return extractedName
        }
      }
    }
  }

  return null
}

async function fixApplicationNames() {
  console.log('🔧 Starting application name fix...\n')

  // Fetch all applications
  const { data: applications, error } = await supabase
    .from('form_responses')
    .select(`
      id,
      respondent_name,
      respondent_email,
      responses,
      user_id,
      user_profiles!user_id (
        name
      )
    `)
    .not('responses', 'is', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching applications:', error)
    return
  }

  if (!applications || applications.length === 0) {
    console.log('No applications found')
    return
  }

  console.log(`📊 Found ${applications.length} applications\n`)

  let updatedCount = 0
  let skippedCount = 0
  let failedCount = 0

  for (const app of applications) {
    const profileName = (app.user_profiles as any)?.name

    // Check if current name matches profile name (indicating it's wrong)
    const needsUpdate = app.respondent_name === profileName

    if (!needsUpdate) {
      console.log(`⏭️  Skipping ${app.respondent_email} - name already correct`)
      skippedCount++
      continue
    }

    // Extract name from responses
    const extractedName = extractNameFromResponses(app.responses || {})

    if (!extractedName) {
      console.log(`⚠️  No name found in responses for ${app.respondent_email}`)
      skippedCount++
      continue
    }

    if (extractedName === profileName) {
      console.log(`⏭️  Skipping ${app.respondent_email} - extracted name same as profile`)
      skippedCount++
      continue
    }

    // Update the application
    console.log(`🔄 Updating ${app.respondent_email}:`)
    console.log(`   From: "${app.respondent_name}" (profile name)`)
    console.log(`   To:   "${extractedName}" (form submission)`)

    const { error: updateError } = await supabase
      .from('form_responses')
      .update({ respondent_name: extractedName })
      .eq('id', app.id)

    if (updateError) {
      console.error(`   ❌ Failed:`, updateError.message)
      failedCount++
    } else {
      console.log(`   ✅ Updated successfully\n`)
      updatedCount++
    }
  }

  console.log('\n═══════════════════════════════════════')
  console.log('📊 SUMMARY')
  console.log('═══════════════════════════════════════')
  console.log(`Total Applications: ${applications.length}`)
  console.log(`✅ Updated: ${updatedCount}`)
  console.log(`⏭️  Skipped: ${skippedCount}`)
  console.log(`❌ Failed: ${failedCount}`)
  console.log('═══════════════════════════════════════\n')

  if (updatedCount > 0) {
    console.log('🎉 Application names have been fixed!')
    console.log('📧 Future emails will now use the correct names from form submissions.')
  }
}

// Run the script
fixApplicationNames().catch(console.error)
