/**
 * Script to create the 'tickets' storage bucket in Supabase
 * Run with: npx tsx scripts/create-tickets-bucket.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTicketsBucket() {
  console.log('🪣 Creating tickets storage bucket...\n')

  // Check if bucket already exists
  const { data: buckets } = await supabase.storage.listBuckets()
  const ticketsBucket = buckets?.find(b => b.name === 'tickets')

  if (ticketsBucket) {
    console.log('✅ Bucket "tickets" already exists!')
    console.log(`   Created: ${ticketsBucket.created_at}`)
    console.log(`   Public: ${ticketsBucket.public}`)
    return
  }

  // Create the bucket
  const { data, error } = await supabase.storage.createBucket('tickets', {
    public: true, // PDFs need to be publicly accessible for email links
    fileSizeLimit: 5 * 1024 * 1024, // 5MB limit per file
    allowedMimeTypes: ['application/pdf']
  })

  if (error) {
    console.error('❌ Failed to create bucket:', error)
    process.exit(1)
  }

  console.log('✅ Successfully created "tickets" bucket!')
  console.log('   Settings:')
  console.log('   - Public: true (for email links)')
  console.log('   - File size limit: 5MB')
  console.log('   - Allowed types: application/pdf')
  console.log('\n📋 Next steps:')
  console.log('   1. Set up RLS policies (optional for public bucket)')
  console.log('   2. Test PDF upload with ticket generation')
}

createTicketsBucket()
  .then(() => {
    console.log('\n✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
