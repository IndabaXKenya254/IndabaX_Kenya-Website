/**
 * Script to fix email template URLs
 * Replaces https://indabaxkenya.com with https://deeplearningindabaxkenya.com
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Template IDs from database
const TEMPLATE_IDS = {
  'Application Received': '9a29e1c0-99a9-40bc-bb2b-c82ecf660bea',
  'Email Verification': 'cc09f8b0-b493-4a58-8166-29579793fd84',
  'Survey Invitation - Shortlisted Applicant': 'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'Welcome Email': '2ec37230-fba7-4865-802c-c0686d10870e'
}

const OLD_URL = 'https://indabaxkenya.com'
const NEW_URL = 'https://deeplearningindabaxkenya.com'

async function fixTemplateUrls() {
  console.log('🔧 Starting email template URL fix...\n')

  // Fetch all templates that need fixing
  const { data: templates, error: fetchError } = await supabase
    .from('email_templates')
    .select('id, name, body')
    .in('id', Object.values(TEMPLATE_IDS))

  if (fetchError) {
    console.error('❌ Error fetching templates:', fetchError)
    process.exit(1)
  }

  if (!templates || templates.length === 0) {
    console.error('❌ No templates found')
    process.exit(1)
  }

  console.log(`📧 Found ${templates.length} templates to update:\n`)

  // Update each template
  for (const template of templates) {
    console.log(`\n📝 Processing: ${template.name}`)
    console.log(`   ID: ${template.id}`)

    // Check if template has old URL
    const hasOldUrl = template.body.includes(OLD_URL)

    if (!hasOldUrl) {
      console.log('   ✅ Already correct (no old URL found)')
      continue
    }

    // Count occurrences
    const occurrences = (template.body.match(new RegExp(OLD_URL, 'g')) || []).length
    console.log(`   🔍 Found ${occurrences} occurrence(s) of old URL`)

    // Replace all occurrences
    const updatedBody = template.body.replaceAll(OLD_URL, NEW_URL)

    // Verify replacement worked
    const stillHasOldUrl = updatedBody.includes(OLD_URL)
    if (stillHasOldUrl) {
      console.error(`   ❌ Failed to replace all URLs in ${template.name}`)
      continue
    }

    // Update in database
    const { error: updateError } = await supabase
      .from('email_templates')
      .update({ body: updatedBody })
      .eq('id', template.id)

    if (updateError) {
      console.error(`   ❌ Error updating ${template.name}:`, updateError)
      continue
    }

    console.log(`   ✅ Updated successfully (replaced ${occurrences} URL(s))`)
  }

  console.log('\n\n🔍 Validating changes...\n')

  // Validate - fetch templates again and check
  const { data: validatedTemplates, error: validateError } = await supabase
    .from('email_templates')
    .select('id, name, body')
    .in('id', Object.values(TEMPLATE_IDS))

  if (validateError) {
    console.error('❌ Error validating templates:', validateError)
    process.exit(1)
  }

  let allFixed = true

  for (const template of validatedTemplates || []) {
    const hasOldUrl = template.body.includes(OLD_URL)
    const hasNewUrl = template.body.includes(NEW_URL)

    if (hasOldUrl) {
      console.log(`❌ ${template.name}: STILL HAS OLD URL`)
      allFixed = false
    } else if (hasNewUrl) {
      console.log(`✅ ${template.name}: Correctly updated`)
    } else {
      console.log(`⚠️  ${template.name}: No URL found (might be an issue)`)
    }
  }

  console.log('\n' + '='.repeat(60))

  if (allFixed) {
    console.log('✅ ALL TEMPLATES FIXED SUCCESSFULLY!')
  } else {
    console.log('❌ Some templates still have issues')
    process.exit(1)
  }

  console.log('='.repeat(60) + '\n')
}

// Run the script
fixTemplateUrls()
  .then(() => {
    console.log('✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
