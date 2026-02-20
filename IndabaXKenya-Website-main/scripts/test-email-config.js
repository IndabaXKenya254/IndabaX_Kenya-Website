#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EMAIL CONFIGURATION TEST SCRIPT
// ═══════════════════════════════════════════════════════════════════════
// Quick test to verify both email accounts are configured correctly
// Usage: node scripts/test-email-config.js

require('dotenv').config({ path: '.env.local' })

const requiredEnvVars = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_APPLICATIONS_PASS',
  'SMTP_ACCOUNTS_PASS',
]

console.log('\n🔍 Checking Email Configuration...\n')
console.log('═'.repeat(60))

let allConfigured = true

// Check each required variable
requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  const isConfigured = value && value.trim() !== ''

  console.log(`${isConfigured ? '✅' : '❌'} ${varName}:`, isConfigured ? '(configured)' : '(MISSING)')

  if (!isConfigured) {
    allConfigured = false
  }
})

console.log('═'.repeat(60))

// Display email accounts
console.log('\n📧 Email Accounts:\n')
console.log('1. applications@deeplearningindabaxkenya.com')
console.log('   Password:', process.env.SMTP_APPLICATIONS_PASS ? '✅ Set' : '❌ Missing')
console.log('   Usage: Event registrations, applications, participant communications')
console.log()
console.log('2. accounts@deeplearningindabaxkenya.com')
console.log('   Password:', process.env.SMTP_ACCOUNTS_PASS ? '✅ Set' : '❌ Missing')
console.log('   Usage: General account emails, system notifications, admin communications')
console.log()

// Display SMTP server
console.log('🌐 SMTP Server:\n')
console.log('   Host:', process.env.SMTP_HOST || '(not set)')
console.log('   Port:', process.env.SMTP_PORT || '(not set)')
console.log('   Secure: true (SSL/TLS)')
console.log()

console.log('═'.repeat(60))

if (allConfigured) {
  console.log('✅ All email configuration variables are set!')
  console.log('\n📝 Next Steps:')
  console.log('   1. Navigate to http://localhost:3003/api/test-email as admin')
  console.log('   2. Use POST to send test emails to verify SMTP connectivity')
  console.log('   3. Check both accounts work correctly')
} else {
  console.log('❌ Some configuration variables are missing!')
  console.log('   Please check your .env.local file')
  process.exit(1)
}

console.log('═'.repeat(60))
console.log()
