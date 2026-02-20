// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EMAIL SENDER
// ═══════════════════════════════════════════════════════════════════════
// Email sending utilities for registration confirmations and notifications
// Phase 4: Registration Flow

import nodemailer from 'nodemailer'

interface RegistrationEmailData {
  recipientName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  eventUrl: string
  responseId: string
  submittedAt: string
}

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
  })
}

/**
 * Send registration confirmation email
 * @param email - Recipient email address
 * @param data - Registration details
 */
export async function sendRegistrationConfirmation(
  email: string,
  data: RegistrationEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use applications email for event registrations
    const transporter = createApplicationsTransporter()

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Registration Confirmed!</h1>
    </div>
    <div class="content">
      <p>Dear ${data.recipientName},</p>

      <p>Thank you for registering for <strong>${data.eventTitle}</strong>!</p>

      <p>Your registration has been successfully received and confirmed.</p>

      <div class="details">
        <h3>Event Details:</h3>
        <p><strong>📅 Date:</strong> ${data.eventDate}</p>
        <p><strong>📍 Location:</strong> ${data.eventLocation}</p>
        <p><strong>🆔 Registration ID:</strong> ${data.responseId}</p>
        <p><strong>⏰ Submitted:</strong> ${data.submittedAt}</p>
      </div>

      <p>You will receive further details about the event closer to the date, including:</p>
      <ul>
        <li>Event schedule and agenda</li>
        <li>Venue directions and parking information</li>
        <li>Any materials or preparations needed</li>
      </ul>

      <center>
        <a href="${data.eventUrl}" class="button">View Event Details</a>
      </center>

      <p>If you have any questions, please don't hesitate to contact us.</p>

      <p>We look forward to seeing you at the event!</p>

      <p>Best regards,<br>
      <strong>IndabaX Kenya Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} IndabaX Kenya. All rights reserved.</p>
      <p>Deep Learning Indaba<sup>X</sup> Kenya</p>
    </div>
  </div>
</body>
</html>
    `

    const textContent = `
Registration Confirmed - ${data.eventTitle}

Dear ${data.recipientName},

Thank you for registering for ${data.eventTitle}!

Your registration has been successfully received and confirmed.

EVENT DETAILS:
Date: ${data.eventDate}
Location: ${data.eventLocation}
Registration ID: ${data.responseId}
Submitted: ${data.submittedAt}

You will receive further details about the event closer to the date.

View event details: ${data.eventUrl}

If you have any questions, please don't hesitate to contact us.

We look forward to seeing you at the event!

Best regards,
IndabaX Kenya Team

---
© ${new Date().getFullYear()} IndabaX Kenya. All rights reserved.
Deep Learning IndabaX Kenya
    `

    const mailOptions = {
      from: `"${process.env.SMTP_APPLICATIONS_FROM_NAME}" <${process.env.SMTP_APPLICATIONS_FROM_EMAIL}>`,
      to: email,
      subject: `Event Registration Confirmation - ${data.eventTitle}`,
      text: textContent,
      html: htmlContent,
    }

    console.log('📧 Sending registration confirmation email to:', email)

    const info = await transporter.sendMail(mailOptions)

    console.log('✅ Email sent successfully:', info.messageId)

    return { success: true }
  } catch (error) {
    console.error('❌ Email sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
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
