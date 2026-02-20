/**
 * Test Email CC/BCC Functionality
 * Run: npx tsx scripts/test-email-ccbcc.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { sendEmail, testEmailConfiguration } from '../src/lib/email/sender'

async function testEmailCcBcc() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('          EMAIL CC/BCC TEST')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('')

  // Test 1: Verify email configuration
  console.log('1. Testing email configuration...')
  const configResult = await testEmailConfiguration('applications')
  if (!configResult.success) {
    console.error('   ❌ Email configuration failed:', configResult.error)
    return
  }
  console.log('   ✅ Email configuration OK')
  console.log('')

  // Test 2: Send test email with 'registrations' category
  // This should CC: kelvingithu09@gmail.com (all), kelvingithu019@gmail.com (registrations)
  // This should BCC: githukelvin254@gmail.com (all)
  console.log('2. Sending test email with "registrations" category...')
  console.log('   Expected CC: kelvingithu09@gmail.com, kelvingithu019@gmail.com')
  console.log('   Expected BCC: githukelvin254@gmail.com')
  console.log('')

  const result = await sendEmail({
    to: 'kelvingithu09@gmail.com', // Primary recipient
    subject: '[TEST] Email CC/BCC Test - Registrations Category',
    html: `
      <h1>Test Email - CC/BCC Verification</h1>
      <p>This is a test email to verify the CC/BCC functionality.</p>
      <h2>Expected Recipients:</h2>
      <ul>
        <li><strong>TO:</strong> kelvingithu09@gmail.com</li>
        <li><strong>CC:</strong> kelvingithu09@gmail.com (category: all), kelvingithu019@gmail.com (category: registrations)</li>
        <li><strong>BCC:</strong> githukelvin254@gmail.com (category: all)</li>
      </ul>
      <h2>Test Details:</h2>
      <ul>
        <li><strong>Category:</strong> registrations</li>
        <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
      </ul>
      <p>If you received this email, the email system is working correctly!</p>
    `,
    category: 'registrations',
    accountType: 'applications',
  })

  if (result) {
    console.log('   ✅ Test email sent successfully!')
    console.log('')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('   CHECK YOUR INBOXES:')
    console.log('   - kelvingithu09@gmail.com (TO + CC)')
    console.log('   - kelvingithu019@gmail.com (CC)')
    console.log('   - githukelvin254@gmail.com (BCC)')
    console.log('═══════════════════════════════════════════════════════════')
  } else {
    console.error('   ❌ Failed to send test email')
  }
}

testEmailCcBcc().catch(console.error)
