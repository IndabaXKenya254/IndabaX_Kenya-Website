// ═══════════════════════════════════════════════════════════════════════
// TEST ALL EMAIL TEMPLATES - VERIFY DATABASE TEMPLATES ARE USED
// ═══════════════════════════════════════════════════════════════════════
// This script tests all 13 email templates to confirm they're pulled from DB

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendApplicationReceivedEmail,
  sendAcceptanceEmail,
  sendRejectionEmailLegacy,
  sendAdminInvitationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from '../src/lib/email/index'

import { sendRegistrationConfirmation } from '../src/lib/email/sender'
import { sendShortlistEmail } from '../src/lib/email/send-shortlist-email'
import { sendApprovalEmail } from '../src/lib/email/send-approval-email'
import { sendRejectionEmail } from '../src/lib/email/send-rejection-email'
import { sendWaitlistEmail } from '../src/lib/email/send-waitlist-email'

const TEST_EMAIL = 'githukelvin254@gmail.com'
const TEST_NAME = 'Kelvin'
const TEST_EVENT = 'IndabaX Kenya 2026'

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testAllTemplates() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  EMAIL TEMPLATE TEST - VERIFYING DATABASE TEMPLATES')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`  Target Email: ${TEST_EMAIL}`)
  console.log(`  Test Name: ${TEST_NAME}`)
  console.log(`  Test Event: ${TEST_EVENT}`)
  console.log('═══════════════════════════════════════════════════════════════\n')

  const results: { template: string; success: boolean; error?: string }[] = []

  // 1. Email Verification
  console.log('1/13 Testing: Email Verification...')
  try {
    const success = await sendVerificationEmail(
      TEST_EMAIL,
      TEST_NAME,
      'https://indabaxkenya.com/verify?token=TEST_TOKEN_123'
    )
    results.push({ template: 'Email Verification', success })
    console.log(`     ${success ? '✅ SENT' : '❌ FAILED'}\n`)
  } catch (e) {
    results.push({ template: 'Email Verification', success: false, error: String(e) })
    console.log(`     ❌ ERROR: ${e}\n`)
  }
  await delay(2000)

  // 2. Welcome Email
  console.log('2/13 Testing: Welcome Email...')
  try {
    const success = await sendWelcomeEmail(TEST_EMAIL, TEST_NAME)
    results.push({ template: 'Welcome Email', success })
    console.log(`     ${success ? '✅ SENT' : '❌ FAILED'}\n`)
  } catch (e) {
    results.push({ template: 'Welcome Email', success: false, error: String(e) })
    console.log(`     ❌ ERROR: ${e}\n`)
  }
  await delay(2000)

  // 3. Application Received
  console.log('3/13 Testing: Application Received...')
  try {
    const success = await sendApplicationReceivedEmail(
      TEST_EMAIL,
      TEST_NAME,
      TEST_EVENT,
      '125cd3cc-0e71-4f29-a857-402a58658b95' // Full UUID - template shortens to APP125CD3CC0E71
    )
    results.push({ template: 'Application Received', success })
    console.log(`     ${success ? '✅ SENT' : '❌ FAILED'}\n`)
  } catch (e) {
    results.push({ template: 'Application Received', success: false, error: String(e) })
    console.log(`     ❌ ERROR: ${e}\n`)
  }
  await delay(2000)

  // 4. Application Approved (via sendApprovalEmail)
  console.log('4/13 Testing: Application Approved...')
  try {
    const success = await sendApprovalEmail({
      to: TEST_EMAIL,
      applicantName: TEST_NAME,
      eventTitle: TEST_EVENT,
      eventDate: 'March 15-16, 2026',
      eventLocation: 'Nairobi, Kenya',
      eventUrl: 'https://indabaxkenya.com/events/2026'
    })
    results.push({ template: 'Application Approved', success })
    console.log(`     ${success ? '✅ SENT' : '❌ FAILED'}\n`)
  } catch (e) {
    results.push({ template: 'Application Approved', success: false, error: String(e) })
    console.log(`     ❌ ERROR: ${e}\n`)
  }
  await delay(2000)

  // 5. Application Rejected
  console.log('5/13 Testing: Application Rejected...')
  try {
    const success = await sendRejectionEmail({
      to: TEST_EMAIL,
      applicantName: TEST_NAME,
      eventTitle: TEST_EVENT,
      notes: 'This is a TEST email - please ignore. We are testing our email system.'
    })
    results.push({ template: 'Application Rejected', success })
    console.log(`     ${success ? '✅ SENT' : '❌ FAILED'}\n`)
  } catch (e) {
    results.push({ template: 'Application Rejected', success: false, error: String(e) })
    console.log(`     ❌ ERROR: ${e}\n`)
  }
  await delay(2000)

  // 6. Waitlist Notification
  console.log('6/13 Testing: Waitlist Notification...')
  try {
    const success = await sendWaitlistEmail({
      to: TEST_EMAIL,
      applicantName: TEST_NAME,
      eventTitle: TEST_EVENT,
      notes: 'This is a TEST email - please ignore.'
    })
    results.push({ template: 'Waitlist Notification', success })
    console.log(`     ${success ? '✅ SENT' : '❌ FAILED'}\n`)
  } catch (e) {
    results.push({ template: 'Waitlist Notification', success: false, error: String(e) })
    console.log(`     ❌ ERROR: ${e}\n`)
  }
  await delay(2000)

  // 7. Survey Invitation (Shortlist)
  console.log('7/13 Testing: Survey Invitation...')
  try {
    const success = await sendShortlistEmail({
      to: TEST_EMAIL,
      applicantName: TEST_NAME,
      eventTitle: TEST_EVENT,
      surveyLink: 'https://indabaxkenya.com/survey/TEST_SURVEY_123',
      deadline: 'January 15, 2026',
      deadlineTime: '11:59 PM EAT'
    })
    results.push({ template: 'Survey Invitation', success })
    console.log(`     ${success ? '✅ SENT' : '❌ FAILED'}\n`)
  } catch (e) {
    results.push({ template: 'Survey Invitation', success: false, error: String(e) })
    console.log(`     ❌ ERROR: ${e}\n`)
  }
  await delay(2000)

  // 8. Registration Confirmation
  console.log('8/13 Testing: Registration Confirmation...')
  try {
    const result = await sendRegistrationConfirmation(TEST_EMAIL, {
      recipientName: TEST_NAME,
      eventTitle: TEST_EVENT,
      eventDate: 'March 15-16, 2026',
      eventLocation: 'Nairobi, Kenya',
      eventUrl: 'https://indabaxkenya.com/events/2026',
      responseId: 'REG-TEST-789012',
      submittedAt: new Date().toLocaleString()
    })
    results.push({ template: 'Registration Confirmation', success: result.success })
    console.log(`     ${result.success ? '✅ SENT' : '❌ FAILED'}\n`)
  } catch (e) {
    results.push({ template: 'Registration Confirmation', success: false, error: String(e) })
    console.log(`     ❌ ERROR: ${e}\n`)
  }
  await delay(2000)

  // 9. Password Reset
  console.log('9/13 Testing: Password Reset...')
  try {
    const success = await sendPasswordResetEmail(
      TEST_EMAIL,
      TEST_NAME,
      'https://indabaxkenya.com/reset-password?token=TEST_RESET_456'
    )
    results.push({ template: 'Password Reset', success })
    console.log(`     ${success ? '✅ SENT' : '❌ FAILED'}\n`)
  } catch (e) {
    results.push({ template: 'Password Reset', success: false, error: String(e) })
    console.log(`     ❌ ERROR: ${e}\n`)
  }
  await delay(2000)

  // 10. Password Changed
  console.log('10/13 Testing: Password Changed...')
  try {
    const success = await sendPasswordChangedEmail(TEST_EMAIL, TEST_NAME)
    results.push({ template: 'Password Changed', success })
    console.log(`     ${success ? '✅ SENT' : '❌ FAILED'}\n`)
  } catch (e) {
    results.push({ template: 'Password Changed', success: false, error: String(e) })
    console.log(`     ❌ ERROR: ${e}\n`)
  }
  await delay(2000)

  // 11. Admin Invitation
  console.log('11/13 Testing: Admin Invitation...')
  try {
    const success = await sendAdminInvitationEmail(
      TEST_EMAIL,
      'admin',
      'TempPass123!',
      'https://indabaxkenya.com/admin/login'
    )
    results.push({ template: 'Admin Invitation', success })
    console.log(`     ${success ? '✅ SENT' : '❌ FAILED'}\n`)
  } catch (e) {
    results.push({ template: 'Admin Invitation', success: false, error: String(e) })
    console.log(`     ❌ ERROR: ${e}\n`)
  }
  await delay(2000)

  // Note: Templates 12 & 13 (Application Status Update, Survey Reminder)
  // don't have dedicated send functions yet, but templates exist

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log('  TEST RESULTS SUMMARY')
  console.log('═══════════════════════════════════════════════════════════════')

  let passed = 0
  let failed = 0

  results.forEach((r, i) => {
    const status = r.success ? '✅ PASS' : '❌ FAIL'
    console.log(`  ${(i + 1).toString().padStart(2)}. ${r.template.padEnd(30)} ${status}`)
    if (r.success) passed++
    else failed++
  })

  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`  TOTAL: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`)
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('\n📧 Check inbox at: githukelvin254@gmail.com')
  console.log('   All emails should have FULL HTML styling from database templates.')
  console.log('   If any email looks plain/unstyled, the fallback was used (problem!).')
}

testAllTemplates().catch(console.error)
