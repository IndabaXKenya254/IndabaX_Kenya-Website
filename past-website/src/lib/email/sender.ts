// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EMAIL SENDER
// ═══════════════════════════════════════════════════════════════════════
// Email sending utilities for registration confirmations and notifications
// Phase 4: Registration Flow
// Updated: December 28, 2025 - Added CC/BCC from email_recipients table
// ═══════════════════════════════════════════════════════════════════════

import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

// Email category type
type EmailCategory = 'all' | 'applications' | 'registrations' | 'notifications' | 'support'

// Create admin client for fetching email recipients
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// ═══════════════════════════════════════════════════════════════════════
// GET CC/BCC RECIPIENTS FROM DATABASE
// ═══════════════════════════════════════════════════════════════════════

interface EmailRecipients {
  cc: string[]
  bcc: string[]
}

/**
 * Fetch CC and BCC email addresses for a specific category
 * @param category - The email category (all, applications, registrations, etc.)
 */
async function getEmailRecipients(category: EmailCategory): Promise<EmailRecipients> {
  try {
    const supabase = createAdminClient()

    // Fetch recipients that match the category OR 'all'
    const { data, error } = await supabase
      .from('email_recipients')
      .select('email, recipient_type')
      .eq('is_active', true)
      .in('email_category', [category, 'all'])

    if (error) {
      console.error('Error fetching email recipients:', error)
      return { cc: [], bcc: [] }
    }

    const cc: string[] = []
    const bcc: string[] = []

    for (const recipient of data || []) {
      if (recipient.recipient_type === 'cc') {
        cc.push(recipient.email)
      } else if (recipient.recipient_type === 'bcc') {
        bcc.push(recipient.email)
      }
    }

    return { cc, bcc }
  } catch (error) {
    console.error('Error fetching email recipients:', error)
    return { cc: [], bcc: [] }
  }
}

const MAX_EMAIL_SEND_ATTEMPTS = 3
const EMAIL_RETRY_DELAY_MS = 500

async function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

async function sendMailWithRetry(
  transporter: nodemailer.Transporter,
  mailOptions: nodemailer.SendMailOptions,
  maxAttempts: number = MAX_EMAIL_SEND_ATTEMPTS
): Promise<nodemailer.SentMessageInfo> {
  let attempt = 0
  let lastError: unknown

  while (attempt < maxAttempts) {
    try {
      attempt += 1
      if (attempt > 1) {
        console.log(`📧 Retrying email send (attempt ${attempt}/${maxAttempts}) to: ${mailOptions.to}`)
      }
      return await transporter.sendMail(mailOptions)
    } catch (error) {
      lastError = error
      console.error(`❌ Email send attempt ${attempt} failed:`, error)
      if (attempt >= maxAttempts) {
        break
      }
      await delay(EMAIL_RETRY_DELAY_MS)
    }
  }

  throw lastError
}

interface RegistrationEmailData {
  recipientName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  eventUrl: string
  responseId: string
  submittedAt: string
  eventId?: string  // For email logging
}

// Issue #42 FIX: Added connection/socket timeouts to prevent email delays
// Create transporter for applications email (event registrations, applications)
const createApplicationsTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_APPLICATIONS_USER,
      pass: process.env.SMTP_APPLICATIONS_PASS,
    },
    connectionTimeout: 10000, // 10 seconds to connect
    greetingTimeout: 10000, // 10 seconds for greeting
    socketTimeout: 30000, // 30 seconds for socket idle
    pool: true, // Reuse connections
    maxConnections: 20, // Increased from 3 for better concurrency
  })
}

// Create transporter for accounts email (user registration, password resets)
const createAccountsTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_ACCOUNTS_USER,
      pass: process.env.SMTP_ACCOUNTS_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
    pool: true,
    maxConnections: 20, // Increased from 3 for better concurrency
  })
}

/**
 * Send registration confirmation email
 * Uses database template with fallback to hardcoded
 * Logs email to email_logs table for tracking
 * @param email - Recipient email address
 * @param data - Registration details
 */
export async function sendRegistrationConfirmation(
  email: string,
  data: RegistrationEmailData
): Promise<{ success: boolean; error?: string }> {
  console.log('📧 [sendRegistrationConfirmation] START - Email:', email, 'Data:', JSON.stringify(data, null, 2))

  const supabase = createAdminClient()
  let htmlContent: string = ''
  let textContent: string = ''
  let subject: string = ''
  let errorMessage: string | null = null
  let emailSent = false

  try {
    console.log('📧 [sendRegistrationConfirmation] Loading template service...')
    // Try database template first - Use APPLICATION_RECEIVED not REGISTRATION_CONFIRMATION
    // This follows the correct flow: User applies → Application Received email
    const { renderTemplate, TEMPLATE_NAMES } = await import('./template-service')
    console.log('📧 [sendRegistrationConfirmation] Template service loaded, rendering template:', TEMPLATE_NAMES.APPLICATION_RECEIVED)
    // Issue #22: Create shortened application reference for database templates
    // Format: APP + first 12 chars of UUID (uppercase, no hyphens) = max 15 chars
    const shortApplicationRef = data.responseId
      ? `APP${data.responseId.replace(/-/g, '').substring(0, 12).toUpperCase()}`
      : ''

    const rendered = await renderTemplate(TEMPLATE_NAMES.APPLICATION_RECEIVED, {
      name: data.recipientName,
      recipient_name: data.recipientName,
      email,
      recipient_email: email,
      event_title: data.eventTitle,
      event_date: data.eventDate,
      event_location: data.eventLocation,
      event_url: data.eventUrl,
      response_id: data.responseId,
      application_reference: shortApplicationRef, // Issue #22: Shortened reference for templates
      submitted_at: data.submittedAt,
    })
    console.log('📧 [sendRegistrationConfirmation] Template rendered:', rendered ? 'SUCCESS' : 'FALLBACK')

    // Use applications email for event registrations
    console.log('📧 [sendRegistrationConfirmation] Creating transporter...')
    const transporter = createApplicationsTransporter()
    console.log('📧 [sendRegistrationConfirmation] Transporter created')

    // Fetch CC/BCC recipients for registrations
    console.log('📧 [sendRegistrationConfirmation] Fetching CC/BCC recipients...')
    const recipients = await getEmailRecipients('registrations')
    console.log('📧 [sendRegistrationConfirmation] Recipients:', JSON.stringify(recipients))

    if (rendered) {
      htmlContent = rendered.html
      textContent = rendered.text
      subject = rendered.subject
    } else {
      // Fallback to hardcoded templates - Use APPLICATION RECEIVED template
      console.warn('Using fallback hardcoded template for: Application Received')
      const { applicationReceivedEmailTemplate, applicationReceivedEmailTextTemplate, getApplicationReceivedSubject } = await import('./templates')

      // Issue #22: Pass full UUID - the template function handles shortening internally
      htmlContent = applicationReceivedEmailTemplate({
        name: data.recipientName,
        eventTitle: data.eventTitle,
        applicationId: data.responseId,
      })

      textContent = applicationReceivedEmailTextTemplate({
        name: data.recipientName,
        eventTitle: data.eventTitle,
        applicationId: data.responseId,
      })

      subject = getApplicationReceivedSubject(data.eventTitle)
    }

    const mailOptions: Record<string, unknown> = {
      from: `"${process.env.SMTP_APPLICATIONS_FROM_NAME}" <${process.env.SMTP_APPLICATIONS_FROM_EMAIL}>`,
      to: email,
      subject,
      text: textContent,
      html: htmlContent,
    }

    // Add CC and BCC if configured
    if (recipients.cc.length > 0) {
      mailOptions.cc = recipients.cc
    }
    if (recipients.bcc.length > 0) {
      mailOptions.bcc = recipients.bcc
    }

    console.log('📧 Sending registration confirmation email to:', email)
    if (recipients.cc.length > 0) console.log('   CC:', recipients.cc.join(', '))
    if (recipients.bcc.length > 0) console.log('   BCC:', recipients.bcc.length, 'recipients')

    const info = await sendMailWithRetry(transporter, mailOptions)
    emailSent = true

    console.log('✅ Email sent successfully:', info.messageId)

    // Log successful email to database
    const now = new Date().toISOString()
    await supabase
      .from('email_logs')
      .insert({
        from_email: process.env.SMTP_APPLICATIONS_FROM_EMAIL || 'applications@deeplearningindabaxkenya.com',
        recipient_email: email,
        recipient_name: data.recipientName,
        cc_emails: recipients.cc.length > 0 ? recipients.cc : null,
        bcc_emails: recipients.bcc.length > 0 ? recipients.bcc : null,
        subject,
        body: htmlContent,
        status: 'sent',
        sent_at: now,
        event_id: data.eventId || null,
        // Note: registration_id references registrations table, not form_responses
        // responseId is stored in variables_used for reference
        variables_used: {
          recipientName: data.recipientName,
          eventTitle: data.eventTitle,
          eventDate: data.eventDate,
          eventLocation: data.eventLocation,
          responseId: data.responseId,
        },
      })
      .then(({ error }) => {
        if (error) {
          console.error('Failed to log email to database:', error)
        } else {
          console.log('📝 Email logged to database')
        }
      })

    return { success: true }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [sendRegistrationConfirmation] Email sending error:', error)
    console.error('❌ [sendRegistrationConfirmation] Error stack:', error instanceof Error ? error.stack : 'No stack')

    // Log failed email to database
    if (subject) {
      await supabase
        .from('email_logs')
        .insert({
          from_email: process.env.SMTP_APPLICATIONS_FROM_EMAIL || 'applications@deeplearningindabaxkenya.com',
          recipient_email: email,
          recipient_name: data.recipientName,
          subject,
          body: htmlContent,
          status: 'failed',
          error_message: errorMessage,
          event_id: data.eventId || null,
          // Note: registration_id references registrations table, not form_responses
          // responseId is stored in variables_used for reference
          variables_used: {
            recipientName: data.recipientName,
            eventTitle: data.eventTitle,
            eventDate: data.eventDate,
            eventLocation: data.eventLocation,
            responseId: data.responseId,
          },
        })
        .then(({ error: logError }) => {
          if (logError) {
            console.error('Failed to log email failure to database:', logError)
          } else {
            console.log('📝 Email failure logged to database')
          }
        })
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Send resume link email
 * @param email - Recipient email address
 * @param eventTitle - Event title
 * @param resumeUrl - URL to resume registration
 */
export async function sendResumeLink(
  email: string,
  eventTitle: string,
  resumeUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📧 Resume link email:', {
      to: email,
      subject: `Continue Your Registration - ${eventTitle}`,
      resumeUrl,
    })

    return { success: true }
  } catch (error) {
    console.error('Email sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// GENERIC SEND EMAIL FUNCTION
// ═══════════════════════════════════════════════════════════════════════

export interface EmailAttachment {
  filename: string
  content: Buffer
  contentType?: string
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  cc?: string | string[]
  bcc?: string | string[]
  accountType?: 'applications' | 'accounts'
  /** Email category for automatic CC/BCC from database */
  category?: EmailCategory
  /** Skip automatic CC/BCC lookup (use only explicit cc/bcc) */
  skipAutoCcBcc?: boolean
  /** File attachments */
  attachments?: EmailAttachment[]
}

/**
 * Generic email sending function
 * Automatically includes CC/BCC from email_recipients table based on category
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const {
    to,
    subject,
    html,
    text,
    cc,
    bcc,
    accountType = 'applications',
    category = 'notifications',
    skipAutoCcBcc = false,
    attachments = []
  } = options

  try {
    const transporter = accountType === 'accounts'
      ? createAccountsTransporter()
      : createApplicationsTransporter()

    const fromName = accountType === 'accounts'
      ? process.env.SMTP_ACCOUNTS_FROM_NAME
      : process.env.SMTP_APPLICATIONS_FROM_NAME

    const fromEmail = accountType === 'accounts'
      ? process.env.SMTP_ACCOUNTS_FROM_EMAIL
      : process.env.SMTP_APPLICATIONS_FROM_EMAIL

    // Fetch automatic CC/BCC from database unless skipped
    let autoRecipients: EmailRecipients = { cc: [], bcc: [] }
    if (!skipAutoCcBcc) {
      autoRecipients = await getEmailRecipients(category)
    }

    // Merge explicit and automatic recipients
    const mergedCc = [
      ...(Array.isArray(cc) ? cc : cc ? [cc] : []),
      ...autoRecipients.cc
    ].filter((email, index, self) => self.indexOf(email) === index) // Remove duplicates

    const mergedBcc = [
      ...(Array.isArray(bcc) ? bcc : bcc ? [bcc] : []),
      ...autoRecipients.bcc
    ].filter((email, index, self) => self.indexOf(email) === index) // Remove duplicates

    const mailOptions: Record<string, unknown> = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    }

    // Add merged CC and BCC
    if (mergedCc.length > 0) mailOptions.cc = mergedCc
    if (mergedBcc.length > 0) mailOptions.bcc = mergedBcc

    // Add attachments if provided
    if (attachments.length > 0) {
      mailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType || 'application/pdf'
      }))
    }

    console.log(`📧 Sending email to: ${to}, Subject: ${subject}`)
    if (mergedCc.length > 0) console.log(`   CC: ${mergedCc.join(', ')}`)
    if (mergedBcc.length > 0) console.log(`   BCC: ${mergedBcc.length} recipients`)
    if (attachments.length > 0) console.log(`   📎 Attachments: ${attachments.map(a => a.filename).join(', ')}`)

    const info = await sendMailWithRetry(transporter, mailOptions)

    console.log('✅ Email sent successfully:', info.messageId)

    // Issue #37 FIX: Log all sent emails to database
    try {
      const { createAdminClient } = await import('@/lib/supabase')
      const supabase = createAdminClient()
      await supabase.from('email_logs').insert({
        from_email: fromEmail,
        recipient_email: to,
        cc_emails: mergedCc.length > 0 ? mergedCc : null,
        bcc_emails: mergedBcc.length > 0 ? mergedBcc : null,
        subject,
        body: html,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
    } catch (logError) {
      console.error('⚠️ Failed to log sent email to database:', logError)
    }

    return true
  } catch (error) {
    console.error('❌ Email sending error:', error)

    // Issue #37 FIX: Log failed emails too
    try {
      const { createAdminClient } = await import('@/lib/supabase')
      const supabase = createAdminClient()
      await supabase.from('email_logs').insert({
        from_email: accountType === 'accounts'
          ? process.env.SMTP_ACCOUNTS_FROM_EMAIL
          : process.env.SMTP_APPLICATIONS_FROM_EMAIL,
        recipient_email: to,
        subject,
        body: html,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        sent_at: new Date().toISOString(),
      })
    } catch (logError) {
      console.error('⚠️ Failed to log email error to database:', logError)
    }

    return false
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TEST/DEBUG FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

interface TestResult {
  success: boolean
  error?: string
}

/**
 * Test email configuration for a specific account type
 */
export async function testEmailConfiguration(
  accountType: 'applications' | 'accounts' = 'applications'
): Promise<TestResult> {
  try {
    const transporter = accountType === 'accounts'
      ? createAccountsTransporter()
      : createApplicationsTransporter()

    await transporter.verify()
    console.log(`✅ ${accountType} email configured correctly`)
    return { success: true }
  } catch (error) {
    console.error(`❌ ${accountType} email configuration error:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get available email accounts
 */
export function getAvailableEmailAccounts(): string[] {
  const accounts: string[] = []

  if (process.env.SMTP_APPLICATIONS_USER) {
    accounts.push('applications')
  }

  if (process.env.SMTP_ACCOUNTS_USER) {
    accounts.push('accounts')
  }

  return accounts
}
