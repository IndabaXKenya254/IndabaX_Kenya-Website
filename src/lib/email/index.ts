// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EMAIL LIBRARY INDEX
// ═══════════════════════════════════════════════════════════════════════
// Central exports for all email functionality
// Phase 2-7: Complete Email System
// Updated: January 2026 - Database template support

import nodemailer from 'nodemailer'
import crypto from 'crypto'
import { getSiteUrl } from '@/lib/config'

// Import sendEmail for internal use
import { sendEmail as sendEmailFromSender } from './sender'

// Re-export from sender
export { sendRegistrationConfirmation, sendResumeLink, sendEmail } from './sender'
export type { SendEmailOptions } from './sender'

// Internal sendEmail alias
const sendEmail = sendEmailFromSender

// Re-export templates (legacy hardcoded - kept for backwards compatibility)
export * from './templates'

// Re-export template service (database templates - preferred)
export * from './template-service'

// Re-export shortlist email
export { sendShortlistEmail } from './send-shortlist-email'

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  cc?: string | string[]
  bcc?: string | string[]
  accountType?: 'applications' | 'accounts'
}

export interface EmailResult {
  success: boolean
  error?: string
  messageId?: string
}

// ═══════════════════════════════════════════════════════════════════════
// TRANSPORTER CREATION
// ═══════════════════════════════════════════════════════════════════════

const createApplicationsTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_APPLICATIONS_USER,
      pass: process.env.SMTP_APPLICATIONS_PASS,
    },
  })
}

const createAccountsTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_ACCOUNTS_USER,
      pass: process.env.SMTP_ACCOUNTS_PASS,
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════
// CORE EMAIL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Send email with full result object
 */
export async function sendEmailWithResult(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, html, text, cc, bcc, accountType = 'applications' } = options

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

    const mailOptions: Record<string, unknown> = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    }

    // Add CC and BCC if provided (check for non-empty arrays or non-empty strings)
    const hasCc = cc && (Array.isArray(cc) ? cc.length > 0 : cc.trim() !== '')
    const hasBcc = bcc && (Array.isArray(bcc) ? bcc.length > 0 : bcc.trim() !== '')

    if (hasCc) mailOptions.cc = cc
    if (hasBcc) mailOptions.bcc = bcc

    console.log(`📧 Sending email to: ${to}, Subject: ${subject}`)
    if (hasCc) console.log(`   CC: ${Array.isArray(cc) ? cc.join(', ') : cc}`)
    if (hasBcc) console.log(`   BCC: ${Array.isArray(bcc) ? bcc.length + ' recipients' : bcc}`)

    const info = await transporter.sendMail(mailOptions)

    console.log('✅ Email sent successfully:', info.messageId)

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Email sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TEMPLATE VARIABLE REPLACEMENT
// ═══════════════════════════════════════════════════════════════════════

/**
 * Replace template variables like {{name}}, {{email}}, {{event_title}}
 * Also handles conditional blocks {{#if variable}}...{{/if}}
 * Removes any unmatched variables from the final output
 */
export function replaceVariables(
  template: string,
  variables: Record<string, string | number | undefined | null>
): string {
  let result = template

  // Handle conditional blocks {{#if variable}}content{{/if}}
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g
  result = result.replace(conditionalRegex, (match, varName, content) => {
    const value = variables[varName]
    if (value && value !== '' && value !== null && value !== undefined) {
      return content
    }
    return '' // Remove block if variable is empty
  })

  // Replace simple variables {{variable}}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(regex, String(value ?? ''))
  }

  // Clean up any remaining unmatched variables (e.g., {{response_id}} if not provided)
  result = result.replace(/\{\{[^}]+\}\}/g, '')

  return result
}

// ═══════════════════════════════════════════════════════════════════════
// EMAIL VERIFICATION (PHASE 2)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generate a verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Send verification email
 * Uses database template with fallback to hardcoded
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationUrl: string
): Promise<boolean> {
  // Try database template first
  const { renderTemplate, TEMPLATE_NAMES } = await import('./template-service')
  const rendered = await renderTemplate(TEMPLATE_NAMES.EMAIL_VERIFICATION, {
    name,
    email,
    verification_url: verificationUrl,
  })

  if (rendered) {
    return sendEmail({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      accountType: 'accounts',
    })
  }

  // Fallback to hardcoded templates
  console.warn('Using fallback hardcoded template for: Email Verification')
  const { verificationEmailTemplate, verificationEmailTextTemplate, getVerificationSubject } = await import('./templates')

  const html = verificationEmailTemplate({ name, verificationUrl })
  const text = verificationEmailTextTemplate({ name, verificationUrl })

  return sendEmail({
    to: email,
    subject: getVerificationSubject(),
    html,
    text,
    accountType: 'accounts',
  })
}

/**
 * Send welcome email after verification
 * Uses database template with fallback to hardcoded
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  const dashboardUrl = `${getSiteUrl()}/dashboard`

  // Try database template first
  const { renderTemplate, TEMPLATE_NAMES } = await import('./template-service')
  const rendered = await renderTemplate(TEMPLATE_NAMES.WELCOME, {
    name,
    email,
    dashboard_url: dashboardUrl,
  })

  if (rendered) {
    return sendEmail({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      accountType: 'accounts',
    })
  }

  // Fallback to hardcoded templates
  console.warn('Using fallback hardcoded template for: Welcome Email')
  const { welcomeEmailTemplate, welcomeEmailTextTemplate, getWelcomeSubject } = await import('./templates')

  const html = welcomeEmailTemplate({ name, dashboardUrl })
  const text = welcomeEmailTextTemplate({ name, dashboardUrl })

  return sendEmail({
    to: email,
    subject: getWelcomeSubject(),
    html,
    text,
    accountType: 'accounts',
  })
}

// ═══════════════════════════════════════════════════════════════════════
// APPLICATION EMAILS (PHASE 4-5)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Send application received confirmation
 * Uses database template with fallback to hardcoded
 */
export async function sendApplicationReceivedEmail(
  email: string,
  name: string,
  eventTitle: string,
  applicationId: string
): Promise<boolean> {
  const dashboardUrl = `${getSiteUrl()}/dashboard`

  // Try database template first
  const { renderTemplate, TEMPLATE_NAMES } = await import('./template-service')
  const rendered = await renderTemplate(TEMPLATE_NAMES.APPLICATION_RECEIVED, {
    name,
    email,
    event_title: eventTitle,
    application_id: applicationId,
    dashboard_url: dashboardUrl,
  })

  if (rendered) {
    return sendEmail({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      accountType: 'applications',
      category: 'registrations',
    })
  }

  // Fallback to hardcoded templates
  console.warn('Using fallback hardcoded template for: Application Received')
  const { applicationReceivedEmailTemplate, applicationReceivedEmailTextTemplate, getApplicationReceivedSubject } = await import('./templates')

  const html = applicationReceivedEmailTemplate({ name, eventTitle, applicationId })
  const text = applicationReceivedEmailTextTemplate({ name, eventTitle, applicationId })

  return sendEmail({
    to: email,
    subject: getApplicationReceivedSubject(eventTitle),
    html,
    text,
    accountType: 'applications',
    category: 'registrations',
  })
}

/**
 * Send acceptance email (uses approval template)
 * Note: For full approval emails with event details, use sendApprovalEmail from send-approval-email.ts
 * Uses database template with fallback to hardcoded
 */
export async function sendAcceptanceEmail(
  email: string,
  name: string,
  eventTitle: string,
  customMessage?: string
): Promise<boolean> {
  const eventUrl = `${getSiteUrl()}/events`
  const dashboardUrl = `${getSiteUrl()}/dashboard`

  // Try database template first
  const { renderTemplate, TEMPLATE_NAMES } = await import('./template-service')
  const rendered = await renderTemplate(TEMPLATE_NAMES.APPLICATION_APPROVED, {
    name,
    applicant_name: name,
    email,
    event_title: eventTitle,
    event_date: 'To be announced',
    event_location: 'To be announced',
    event_url: eventUrl,
    dashboard_url: dashboardUrl,
    notes: customMessage,
  })

  if (rendered) {
    return sendEmail({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      accountType: 'applications',
    })
  }

  // Fallback to hardcoded templates
  console.warn('Using fallback hardcoded template for: Application Approved')
  const { approvalEmailTemplate, approvalEmailTextTemplate, getApprovalSubject } = await import('./templates')

  const html = approvalEmailTemplate({
    applicantName: name,
    eventTitle,
    eventDate: 'To be announced',
    eventLocation: 'To be announced',
    eventUrl,
  })
  const text = approvalEmailTextTemplate({
    applicantName: name,
    eventTitle,
    eventDate: 'To be announced',
    eventLocation: 'To be announced',
    eventUrl,
  })

  return sendEmail({
    to: email,
    subject: getApprovalSubject(eventTitle),
    html,
    text,
    accountType: 'applications',
  })
}

/**
 * Send rejection email (uses rejection template)
 * Note: For rejection emails with notes, use sendRejectionEmail from send-rejection-email.ts
 * Uses database template with fallback to hardcoded
 */
export async function sendRejectionEmailLegacy(
  email: string,
  name: string,
  eventTitle: string,
  customMessage?: string
): Promise<boolean> {
  // Try database template first
  const { renderTemplate, TEMPLATE_NAMES } = await import('./template-service')
  const rendered = await renderTemplate(TEMPLATE_NAMES.APPLICATION_REJECTED, {
    name,
    applicant_name: name,
    email,
    event_title: eventTitle,
    notes: customMessage,
  })

  if (rendered) {
    return sendEmail({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      accountType: 'applications',
    })
  }

  // Fallback to hardcoded templates
  console.warn('Using fallback hardcoded template for: Application Rejected')
  const { rejectionEmailTemplate, rejectionEmailTextTemplate, getRejectionSubject } = await import('./templates')

  const html = rejectionEmailTemplate({
    applicantName: name,
    eventTitle,
    notes: customMessage,
  })
  const text = rejectionEmailTextTemplate({
    applicantName: name,
    eventTitle,
    notes: customMessage,
  })

  return sendEmail({
    to: email,
    subject: getRejectionSubject(eventTitle),
    html,
    text,
    accountType: 'applications',
  })
}

// ═══════════════════════════════════════════════════════════════════════
// ADMIN INVITATION EMAIL (Phase: Admin Management)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Send admin invitation email with temporary password
 * Uses database template with fallback to hardcoded
 */
export async function sendAdminInvitationEmail(
  email: string,
  role: string,
  temporaryPassword: string,
  loginUrl: string
): Promise<boolean> {
  const roleType = role === 'super_admin' ? 'super_admin' : 'admin' as const
  const roleDisplay = roleType === 'super_admin' ? 'Super Admin' : 'Admin'

  // Try database template first
  const { renderTemplate, TEMPLATE_NAMES } = await import('./template-service')
  const rendered = await renderTemplate(TEMPLATE_NAMES.ADMIN_INVITATION, {
    email,
    role: roleDisplay,
    temporary_password: temporaryPassword,
    login_url: loginUrl,
  })

  if (rendered) {
    return sendEmail({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      accountType: 'accounts',
      skipAutoCcBcc: true, // Don't CC/BCC for security
    })
  }

  // Fallback to hardcoded templates
  console.warn('Using fallback hardcoded template for: Admin Invitation')
  const { adminInvitationEmailTemplate, adminInvitationEmailTextTemplate, getAdminInvitationSubject } = await import('./templates')

  const html = adminInvitationEmailTemplate({ email, role: roleType, temporaryPassword, loginUrl })
  const text = adminInvitationEmailTextTemplate({ email, role: roleType, temporaryPassword, loginUrl })

  return sendEmail({
    to: email,
    subject: getAdminInvitationSubject(roleType),
    html,
    text,
    accountType: 'accounts',
    skipAutoCcBcc: true, // Don't CC/BCC for security
  })
}

// ═══════════════════════════════════════════════════════════════════════
// PASSWORD RESET EMAIL (Phase: Password Management)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Send password reset email
 * Uses database template with fallback to hardcoded
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
): Promise<boolean> {
  // Try database template first
  const { renderTemplate, TEMPLATE_NAMES } = await import('./template-service')
  const rendered = await renderTemplate(TEMPLATE_NAMES.PASSWORD_RESET, {
    name,
    email,
    reset_url: resetUrl,
  })

  if (rendered) {
    return sendEmail({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      accountType: 'accounts',
      skipAutoCcBcc: true, // Don't CC/BCC for security
    })
  }

  // Fallback to hardcoded templates
  console.warn('Using fallback hardcoded template for: Password Reset')
  const { passwordResetEmailTemplate, passwordResetEmailTextTemplate, getPasswordResetSubject } = await import('./templates')

  const html = passwordResetEmailTemplate({ name, resetUrl })
  const text = passwordResetEmailTextTemplate({ name, resetUrl })

  return sendEmail({
    to: email,
    subject: getPasswordResetSubject(),
    html,
    text,
    accountType: 'accounts',
    skipAutoCcBcc: true, // Don't CC/BCC for security
  })
}

/**
 * Send password changed confirmation email
 * Uses database template with fallback to hardcoded
 */
export async function sendPasswordChangedEmail(
  email: string,
  name: string
): Promise<boolean> {
  // Try database template first
  const { renderTemplate, TEMPLATE_NAMES } = await import('./template-service')
  const rendered = await renderTemplate(TEMPLATE_NAMES.PASSWORD_CHANGED, {
    name,
    email,
  })

  if (rendered) {
    return sendEmail({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      accountType: 'accounts',
      skipAutoCcBcc: true,
    })
  }

  // Fallback to hardcoded templates
  console.warn('Using fallback hardcoded template for: Password Changed')
  const { passwordChangedEmailTemplate, passwordChangedEmailTextTemplate, getPasswordChangedSubject } = await import('./templates')

  const html = passwordChangedEmailTemplate({ name })
  const text = passwordChangedEmailTextTemplate({ name })

  return sendEmail({
    to: email,
    subject: getPasswordChangedSubject(),
    html,
    text,
    accountType: 'accounts',
    skipAutoCcBcc: true,
  })
}

// ═══════════════════════════════════════════════════════════════════════
// TEST/DEBUG FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<{ applications: boolean; accounts: boolean }> {
  const results = { applications: false, accounts: false }

  try {
    const appTransporter = createApplicationsTransporter()
    await appTransporter.verify()
    results.applications = true
    console.log('✅ Applications email configured correctly')
  } catch (error) {
    console.error('❌ Applications email configuration error:', error)
  }

  try {
    const accTransporter = createAccountsTransporter()
    await accTransporter.verify()
    results.accounts = true
    console.log('✅ Accounts email configured correctly')
  } catch (error) {
    console.error('❌ Accounts email configuration error:', error)
  }

  return results
}
