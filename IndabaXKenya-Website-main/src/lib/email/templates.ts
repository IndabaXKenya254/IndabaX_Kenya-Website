// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════
// HTML email templates for registration confirmations
// Phase 4: Registration Flow

import { getSiteUrl, getWebsiteLinks, EMAIL_CONFIG } from '@/lib/config'

interface RegistrationConfirmationData {
  recipientName: string
  recipientEmail: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  eventUrl: string
  responseId: string
  submittedAt: string
}

/**
 * Registration confirmation email template
 */
export function registrationConfirmationTemplate(data: RegistrationConfirmationData): string {
  const {
    recipientName,
    eventTitle,
    eventDate,
    eventLocation,
    eventUrl,
    responseId,
    submittedAt,
  } = data

  // Issue #22 FIX: Shorten application reference to max 15 chars, no hyphens
  // Format: APP + first 12 chars of UUID (uppercase, no hyphens)
  const shortRef = responseId
    ? `APP${responseId.replace(/-/g, '').substring(0, 12).toUpperCase()}`
    : ''

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Confirmation - ${eventTitle}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 3px solid #0d6efd;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #0d6efd;
      margin-bottom: 10px;
    }
    h1 {
      color: #0d6efd;
      margin-top: 30px;
      margin-bottom: 20px;
      font-size: 24px;
    }
    .success-icon {
      font-size: 48px;
      color: #28a745;
      text-align: center;
      margin: 20px 0;
    }
    .event-details {
      background-color: #f8f9fa;
      border-left: 4px solid #0d6efd;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .event-details h2 {
      margin-top: 0;
      color: #0d6efd;
      font-size: 20px;
    }
    .detail-row {
      margin: 10px 0;
      display: flex;
      align-items: flex-start;
    }
    .detail-label {
      font-weight: 600;
      min-width: 100px;
      color: #555;
    }
    .detail-value {
      color: #333;
    }
    .cta-button {
      display: inline-block;
      background-color: #0d6efd;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 5px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .cta-button:hover {
      background-color: #0b5ed7;
    }
    .info-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 14px;
    }
    .footer a {
      color: #0d6efd;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      .container {
        padding: 20px;
      }
      .detail-row {
        flex-direction: column;
      }
      .detail-label {
        margin-bottom: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">IndabaX Kenya</div>
      <p style="margin: 0; color: #666;">Deep Learning Indaba</p>
    </div>

    <!-- Success Icon -->
    <div class="success-icon">✓</div>

    <!-- Main Content -->
    <h1>Registration Confirmed!</h1>

    <p>Dear ${recipientName || 'Participant'},</p>

    <p>Thank you for registering for <strong>${eventTitle}</strong>. We have successfully received your registration and are excited to have you join us!</p>

    <!-- Event Details -->
    <div class="event-details">
      <h2>Event Details</h2>
      <div class="detail-row">
        <span class="detail-label">Event:</span>
        <span class="detail-value">${eventTitle}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date:</span>
        <span class="detail-value">${eventDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Location:</span>
        <span class="detail-value">${eventLocation}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Registered:</span>
        <span class="detail-value">${submittedAt}</span>
      </div>${shortRef ? `
      <div class="detail-row">
        <span class="detail-label">Reference:</span>
        <span class="detail-value" style="font-family: monospace; font-weight: 600;">${shortRef}</span>
      </div>` : ''}
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${eventUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; text-align: center;" target="_blank">
        <span style="color: #ffffff;">View Event Details</span>
      </a>
    </div>

    <!-- Important Information -->
    <div class="info-box">
      <strong>📋 What's Next?</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>You will receive further details about the event via email</li>
        <li>Keep an eye on your inbox for updates and reminders</li>
        <li>If you have any questions, feel free to reach out to us</li>
      </ul>
    </div>

    <p>We look forward to seeing you at the event!</p>

    <p>Best regards,<br>
    <strong>The IndabaX Kenya Team</strong></p>

    <!-- Footer -->
    <div class="footer">
      <p>This is an automated confirmation email. Please do not reply to this message.</p>
      <p>
        <a href="${getWebsiteLinks().home}">Visit Our Website</a> •
        <a href="${getWebsiteLinks().contact}">Contact Us</a>
      </p>
      <p style="margin-top: 20px; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Plain text version of registration confirmation
 */
export function registrationConfirmationTextTemplate(data: RegistrationConfirmationData): string {
  const {
    recipientName,
    eventTitle,
    eventDate,
    eventLocation,
    eventUrl,
    submittedAt,
  } = data

  return `
REGISTRATION CONFIRMED
======================

Dear ${recipientName || 'Participant'},

Thank you for registering for ${eventTitle}. We have successfully received your registration and are excited to have you join us!

EVENT DETAILS
-------------
Event: ${eventTitle}
Date: ${eventDate}
Location: ${eventLocation}
Registered: ${submittedAt}

View Event Details: ${eventUrl}

WHAT'S NEXT?
------------
• You will receive further details about the event via email
• Keep an eye on your inbox for updates and reminders
• If you have any questions, feel free to reach out to us

We look forward to seeing you at the event!

Best regards,
The IndabaX Kenya Team

---
This is an automated confirmation email. Please do not reply to this message.

Visit Our Website: ${getWebsiteLinks().home}
Contact Us: ${getWebsiteLinks().contact}

© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.
  `.trim()
}

/**
 * Email subject line generator
 */
export function getRegistrationConfirmationSubject(eventTitle: string): string {
  return `Registration Confirmed: ${eventTitle}`
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 5: SHORTLIST EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════

interface ShortlistEmailData {
  applicantName: string
  eventTitle: string
  surveyLink: string
  deadline: string
  deadlineTime: string
}

/**
 * Shortlist notification email template
 * Sent when an applicant is shortlisted and needs to complete a detailed survey
 */
export function shortlistEmailTemplate(data: ShortlistEmailData): string {
  const {
    applicantName,
    eventTitle,
    surveyLink,
    deadline,
    deadlineTime,
  } = data

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Congratulations - You've Been Shortlisted!</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 3px solid #28a745;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #28a745;
      margin-bottom: 10px;
    }
    h1 {
      color: #28a745;
      margin-top: 30px;
      margin-bottom: 20px;
      font-size: 24px;
    }
    .success-icon {
      font-size: 48px;
      color: #28a745;
      text-align: center;
      margin: 20px 0;
    }
    .highlight-box {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      margin: 30px 0;
      text-align: center;
    }
    .highlight-box h2 {
      margin-top: 0;
      color: #ffffff;
      font-size: 22px;
    }
    .cta-button {
      display: inline-block;
      background-color: #ffffff;
      color: #28a745;
      text-decoration: none;
      padding: 15px 40px;
      border-radius: 5px;
      font-weight: 700;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }
    .deadline-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .deadline-box strong {
      color: #856404;
      font-size: 18px;
    }
    .deadline-box .time {
      font-size: 24px;
      font-weight: bold;
      color: #856404;
      margin: 10px 0;
    }
    .info-box {
      background-color: #e7f3ff;
      border-left: 4px solid #0d6efd;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box strong {
      color: #0d6efd;
    }
    .steps {
      margin: 20px 0;
      padding-left: 0;
      list-style: none;
      counter-reset: step-counter;
    }
    .steps li {
      counter-increment: step-counter;
      margin: 15px 0;
      padding-left: 40px;
      position: relative;
    }
    .steps li::before {
      content: counter(step-counter);
      position: absolute;
      left: 0;
      top: 0;
      background-color: #28a745;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 14px;
    }
    .footer a {
      color: #28a745;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      .container {
        padding: 20px;
      }
      .highlight-box {
        padding: 20px;
      }
      .cta-button {
        padding: 12px 30px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">🎉 IndabaX Kenya</div>
      <p style="margin: 0; color: #666;">Deep Learning Indaba</p>
    </div>

    <!-- Success Icon -->
    <div class="success-icon">🌟</div>

    <!-- Main Content -->
    <h1>Congratulations! You've Been Shortlisted</h1>

    <p>Dear ${applicantName || 'Applicant'},</p>

    <p>We are delighted to inform you that your application for <strong>${eventTitle}</strong> has been shortlisted! This is an important step in our selection process, and we are impressed by your qualifications and interest in participating.</p>

    <!-- Highlight Box -->
    <div class="highlight-box">
      <h2>🔗 Complete Your Survey</h2>
      <p style="margin: 10px 0;">To continue with your application, please complete the detailed survey using the link below:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${surveyLink}" style="display: inline-block; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; text-align: center;" target="_blank">
          <span style="color: #ffffff;">Access Your Survey</span>
        </a>
      </div>
    </div>

    <!-- Deadline -->
    <div class="deadline-box">
      <strong>⏰ Important Deadline</strong>
      <div class="time">${deadline}</div>
      <p style="margin: 5px 0 0 0;">at ${deadlineTime}</p>
      <p style="margin: 10px 0 0 0; font-size: 14px;">Please complete the survey before this deadline. Late submissions may not be considered.</p>
    </div>

    <!-- Next Steps -->
    <div class="info-box">
      <strong>📋 What Happens Next?</strong>
      <ol class="steps">
        <li><strong>Click the survey link above</strong> to access your personalized survey</li>
        <li><strong>Complete all required questions</strong> - take your time to provide thoughtful answers</li>
        <li><strong>Submit your responses</strong> before the deadline</li>
        <li><strong>Wait for our final decision</strong> - we'll notify you via email within a few days</li>
      </ol>
    </div>

    <div class="info-box" style="background-color: #fff3cd; border-left-color: #ffc107;">
      <strong style="color: #856404;">⚠️ Important Notes:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #856404;">
        <li>This survey link is unique to you - please do not share it</li>
        <li>You can save your progress and return to complete it later</li>
        <li>Ensure you submit before the deadline</li>
        <li>If you have any issues, contact us immediately</li>
      </ul>
    </div>

    <p>We look forward to learning more about you through your survey responses. Good luck with your application!</p>

    <p>Best regards,<br>
    <strong>The IndabaX Kenya Selection Committee</strong></p>

    <!-- Footer -->
    <div class="footer">
      <p>This is an automated notification. If you have questions, please contact us.</p>
      <p>
        <a href="${getWebsiteLinks().home}">Visit Our Website</a> •
        <a href="${getWebsiteLinks().contact}">Contact Us</a>
      </p>
      <p style="margin-top: 20px; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Plain text version of shortlist email
 */
export function shortlistEmailTextTemplate(data: ShortlistEmailData): string {
  const {
    applicantName,
    eventTitle,
    surveyLink,
    deadline,
    deadlineTime,
  } = data

  return `
CONGRATULATIONS - YOU'VE BEEN SHORTLISTED!
==========================================

Dear ${applicantName || 'Applicant'},

We are delighted to inform you that your application for ${eventTitle} has been shortlisted! This is an important step in our selection process, and we are impressed by your qualifications and interest in participating.

COMPLETE YOUR SURVEY
--------------------
To continue with your application, please complete the detailed survey using this link:

${surveyLink}

IMPORTANT DEADLINE
------------------
Survey must be completed by: ${deadline} at ${deadlineTime}

Please complete the survey before this deadline. Late submissions may not be considered.

WHAT HAPPENS NEXT?
------------------
1. Click the survey link above to access your personalized survey
2. Complete all required questions - take your time to provide thoughtful answers
3. Submit your responses before the deadline
4. Wait for our final decision - we'll notify you via email within a few days

IMPORTANT NOTES:
----------------
• This survey link is unique to you - please do not share it
• You can save your progress and return to complete it later
• Ensure you submit before the deadline
• If you have any issues, contact us immediately

We look forward to learning more about you through your survey responses. Good luck with your application!

Best regards,
The IndabaX Kenya Selection Committee

---
This is an automated notification. If you have questions, please contact us.

Visit Our Website: ${getWebsiteLinks().home}
Contact Us: ${getWebsiteLinks().contact}

© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.
  `.trim()
}

/**
 * Email subject line for shortlist notification
 */
export function getShortlistSubject(eventTitle: string): string {
  return `🎉 Congratulations! You've Been Shortlisted - ${eventTitle}`
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 5: APPROVAL EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════

interface ApprovalEmailData {
  applicantName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  eventUrl: string
}

/**
 * Approval notification email template
 * Sent when an application is approved - applicant is officially accepted
 */
export function approvalEmailTemplate(data: ApprovalEmailData): string {
  const {
    applicantName,
    eventTitle,
    eventDate,
    eventLocation,
    eventUrl,
  } = data

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Approved - Welcome to ${eventTitle}!</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 3px solid #28a745;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #28a745;
      margin-bottom: 10px;
    }
    h1 {
      color: #28a745;
      margin-top: 30px;
      margin-bottom: 20px;
      font-size: 26px;
    }
    .success-icon {
      font-size: 64px;
      color: #28a745;
      text-align: center;
      margin: 30px 0;
    }
    .approval-box {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .approval-box h2 {
      margin: 0 0 15px 0;
      font-size: 24px;
      color: #ffffff;
    }
    .approval-box p {
      margin: 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .event-details {
      background-color: #f8f9fa;
      border-left: 4px solid #28a745;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .event-details h3 {
      margin-top: 0;
      color: #28a745;
      font-size: 18px;
    }
    .detail-row {
      margin: 12px 0;
      display: flex;
      align-items: flex-start;
    }
    .detail-label {
      font-weight: 600;
      min-width: 100px;
      color: #555;
    }
    .detail-value {
      color: #333;
      flex: 1;
    }
    .next-steps {
      background-color: #e7f5ff;
      border-left: 4px solid #0d6efd;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .next-steps h3 {
      margin-top: 0;
      color: #0d6efd;
      font-size: 18px;
    }
    .next-steps ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .next-steps li {
      margin: 8px 0;
      color: #333;
    }
    .cta-button {
      display: inline-block;
      background-color: #28a745;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .cta-button:hover {
      background-color: #218838;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #e9ecef;
      color: #6c757d;
      font-size: 14px;
    }
    .footer a {
      color: #0d6efd;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">IndabaX Kenya</div>
      <p style="color: #6c757d; margin: 0;">Deep Learning Community</p>
    </div>

    <div class="success-icon">🎉</div>

    <h1>Congratulations, ${applicantName || 'Applicant'}!</h1>

    <div class="approval-box">
      <h2>Your Application Has Been Approved!</h2>
      <p>We are thrilled to welcome you to ${eventTitle}</p>
    </div>

    <p>
      We are delighted to inform you that after careful review of your application,
      you have been <strong>officially accepted</strong> to participate in ${eventTitle}!
    </p>

    <div class="event-details">
      <h3>📅 Event Details</h3>
      <div class="detail-row">
        <span class="detail-label">Event:</span>
        <span class="detail-value"><strong>${eventTitle}</strong></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date:</span>
        <span class="detail-value">${eventDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Location:</span>
        <span class="detail-value">${eventLocation}</span>
      </div>
    </div>

    <div class="next-steps">
      <h3>📝 Next Steps</h3>
      <ul>
        <li><strong>Check Your Email:</strong> You will receive your event ticket shortly</li>
        <li><strong>Mark Your Calendar:</strong> Save the date and make travel arrangements if needed</li>
        <li><strong>Prepare for the Event:</strong> Review the event agenda and materials (if provided)</li>
        <li><strong>Stay Connected:</strong> Follow us on social media for updates and announcements</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${eventUrl}" style="display: inline-block; background-color: #28a745; color: #ffffff !important; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; text-align: center;" target="_blank">
        <span style="color: #ffffff;">View Event Details</span>
      </a>
    </div>

    <p style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
      <strong>⚠️ Important:</strong> Please keep this email for your records. If you have any questions or need assistance,
      don't hesitate to contact us at <a href="mailto:${EMAIL_CONFIG.support}" style="color: #0d6efd;">${EMAIL_CONFIG.support}</a>
    </p>

    <p style="margin-top: 30px; color: #6c757d; font-size: 15px;">
      We are excited to have you join us and look forward to an amazing event together.
      See you at ${eventTitle}!
    </p>

    <p style="margin-top: 20px;">
      <strong>Best regards,</strong><br>
      The IndabaX Kenya Team
    </p>

    <div class="footer">
      <p style="margin: 10px 0;">
        <a href="${getWebsiteLinks().home}">Visit Our Website</a> |
        <a href="${getWebsiteLinks().contact}">Contact Us</a>
      </p>
      <p style="margin: 10px 0; font-size: 12px;">
        This is an automated notification. Please do not reply to this email.
      </p>
      <p style="margin: 10px 0; font-size: 12px;">
        © ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Plain text version of approval email
 */
export function approvalEmailTextTemplate(data: ApprovalEmailData): string {
  const {
    applicantName,
    eventTitle,
    eventDate,
    eventLocation,
    eventUrl,
  } = data

  return `
CONGRATULATIONS - YOUR APPLICATION HAS BEEN APPROVED!
======================================================

Dear ${applicantName || 'Applicant'},

🎉 We are thrilled to welcome you to ${eventTitle}!

We are delighted to inform you that after careful review of your application, you have been officially accepted to participate in ${eventTitle}.

EVENT DETAILS
-------------
Event: ${eventTitle}
Date: ${eventDate}
Location: ${eventLocation}
Website: ${eventUrl}

NEXT STEPS
----------
• Check Your Email: You will receive your event ticket shortly
• Mark Your Calendar: Save the date and make travel arrangements if needed
• Prepare for the Event: Review the event agenda and materials (if provided)
• Stay Connected: Follow us on social media for updates

IMPORTANT
---------
Please keep this email for your records. If you have any questions or need assistance, don't hesitate to contact us at ${EMAIL_CONFIG.support}

We are excited to have you join us and look forward to an amazing event together. See you at ${eventTitle}!

Best regards,
The IndabaX Kenya Team

---
This is an automated notification. Please do not reply to this email.

Visit Our Website: ${getWebsiteLinks().home}
Contact Us: ${getWebsiteLinks().contact}

© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.
  `.trim()
}

/**
 * Email subject line for approval notification
 */
export function getApprovalSubject(eventTitle: string): string {
  return `🎉 Application Approved - Welcome to ${eventTitle}!`
}

// ═══════════════════════════════════════════════════════════════════════
// REJECTION EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════

export interface RejectionEmailData {
  applicantName: string
  eventTitle: string
  notes?: string
}

/**
 * Rejection email HTML template
 */
export function rejectionEmailTemplate(data: RejectionEmailData): string {
  const { applicantName, eventTitle, notes } = data

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update - ${eventTitle}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 3px solid #0d6efd;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #0d6efd;
      margin-bottom: 10px;
    }
    h1 {
      color: #333;
      margin-top: 30px;
      margin-bottom: 20px;
      font-size: 24px;
    }
    .message-box {
      background-color: #f8f9fa;
      border-left: 4px solid #6c757d;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .message-box p {
      margin: 0;
      color: #555;
    }
    .notes-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .notes-box h3 {
      margin-top: 0;
      color: #856404;
      font-size: 16px;
    }
    .notes-box p {
      margin: 0;
      color: #664d03;
    }
    .encouragement {
      background-color: #e7f5ff;
      border-left: 4px solid #0d6efd;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .encouragement h3 {
      margin-top: 0;
      color: #0d6efd;
      font-size: 16px;
    }
    .encouragement ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .encouragement li {
      margin: 8px 0;
      color: #333;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #e9ecef;
      color: #6c757d;
      font-size: 14px;
    }
    .footer a {
      color: #0d6efd;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">IndabaX Kenya</div>
      <p style="margin: 0; color: #6c757d;">Application Update</p>
    </div>

    <h1>Dear ${applicantName},</h1>

    <p>Thank you for your interest in <strong>${eventTitle}</strong> and for taking the time to submit your application.</p>

    <div class="message-box">
      <p>After careful review of all applications, we regret to inform you that we are unable to offer you a spot at this time due to the limited capacity and the high volume of qualified applicants we received.</p>
    </div>

    ${notes ? `
    <div class="notes-box">
      <h3>Feedback from our team:</h3>
      <p>${notes}</p>
    </div>
    ` : ''}

    <div class="encouragement">
      <h3>Stay Connected!</h3>
      <p>We encourage you to:</p>
      <ul>
        <li>Apply for future IndabaX Kenya events</li>
        <li>Follow us on social media for updates and opportunities</li>
        <li>Join our community to stay engaged with AI/ML enthusiasts</li>
        <li>Visit our website for learning resources and event announcements</li>
      </ul>
    </div>

    <p>We appreciate your understanding and hope to see you at future events. Your interest in advancing AI/ML in Africa is valued, and we encourage you to continue pursuing these opportunities.</p>

    <p>If you have any questions, please don't hesitate to reach out to us.</p>

    <p>Best regards,<br>
    <strong>The IndabaX Kenya Team</strong></p>

    <div class="footer">
      <p>
        <a href="${getWebsiteLinks().home}">Visit Our Website</a> |
        <a href="${getWebsiteLinks().contact}">Contact Us</a>
      </p>
      <p>© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Rejection email plain text template
 */
export function rejectionEmailTextTemplate(data: RejectionEmailData): string {
  const { applicantName, eventTitle, notes } = data

  return `
APPLICATION UPDATE - ${eventTitle}
${'='.repeat(50)}

Dear ${applicantName},

Thank you for your interest in ${eventTitle} and for taking the time to submit your application.

After careful review of all applications, we regret to inform you that we are unable to offer you a spot at this time due to the limited capacity and the high volume of qualified applicants we received.

${notes ? `
FEEDBACK FROM OUR TEAM
----------------------
${notes}
` : ''}

STAY CONNECTED
--------------
We encourage you to:
- Apply for future IndabaX Kenya events
- Follow us on social media for updates and opportunities
- Join our community to stay engaged with AI/ML enthusiasts
- Visit our website for learning resources and event announcements

We appreciate your understanding and hope to see you at future events. Your interest in advancing AI/ML in Africa is valued, and we encourage you to continue pursuing these opportunities.

If you have any questions, please don't hesitate to reach out to us.

Best regards,
The IndabaX Kenya Team

---
Visit Our Website: ${getWebsiteLinks().home}
Contact Us: ${getWebsiteLinks().contact}

© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.
  `.trim()
}

/**
 * Email subject line for rejection notification
 */
export function getRejectionSubject(eventTitle: string): string {
  return `Application Update - ${eventTitle}`
}

// ═══════════════════════════════════════════════════════════════════════
// WAITLIST EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════

export interface WaitlistEmailData {
  applicantName: string
  eventTitle: string
  notes?: string
}

/**
 * Waitlist email HTML template
 */
export function waitlistEmailTemplate(data: WaitlistEmailData): string {
  const { applicantName, eventTitle, notes } = data

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're on the Waitlist - ${eventTitle}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 3px solid #ffc107;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #ffc107;
      margin-bottom: 10px;
    }
    h1 {
      color: #856404;
      margin-top: 30px;
      margin-bottom: 20px;
      font-size: 24px;
    }
    .waitlist-icon {
      font-size: 64px;
      color: #ffc107;
      text-align: center;
      margin: 30px 0;
    }
    .waitlist-box {
      background: linear-gradient(135deg, #ffc107 0%, #ffcd39 100%);
      color: #333;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .waitlist-box h2 {
      margin: 0 0 15px 0;
      font-size: 22px;
      color: #333;
    }
    .waitlist-box p {
      margin: 0;
      font-size: 16px;
      color: #555;
    }
    .message-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .message-box p {
      margin: 0;
      color: #664d03;
    }
    .notes-box {
      background-color: #e7f5ff;
      border-left: 4px solid #0d6efd;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .notes-box h3 {
      margin-top: 0;
      color: #0d6efd;
      font-size: 16px;
    }
    .notes-box p {
      margin: 0;
      color: #333;
    }
    .info-section {
      background-color: #f8f9fa;
      border-left: 4px solid #6c757d;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .info-section h3 {
      margin-top: 0;
      color: #495057;
      font-size: 16px;
    }
    .info-section ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .info-section li {
      margin: 8px 0;
      color: #555;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #e9ecef;
      color: #6c757d;
      font-size: 14px;
    }
    .footer a {
      color: #0d6efd;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">IndabaX Kenya</div>
      <p style="margin: 0; color: #6c757d;">Application Update</p>
    </div>

    <div class="waitlist-icon">⏳</div>

    <h1>Dear ${applicantName},</h1>

    <div class="waitlist-box">
      <h2>You're on the Waitlist!</h2>
      <p>Your application for ${eventTitle} has been placed on our waitlist</p>
    </div>

    <p>Thank you for your interest in <strong>${eventTitle}</strong> and for taking the time to submit your application.</p>

    <div class="message-box">
      <p>After careful review of all applications, we have placed you on our <strong>waitlist</strong>. This means that while we cannot offer you a confirmed spot at this time due to limited capacity, you may still be considered if spaces become available.</p>
    </div>

    ${notes ? `
    <div class="notes-box">
      <h3>Note from our team:</h3>
      <p>${notes}</p>
    </div>
    ` : ''}

    <div class="info-section">
      <h3>What does being on the waitlist mean?</h3>
      <ul>
        <li><strong>You're still in consideration:</strong> If confirmed attendees cancel or additional spots open up, we will reach out to you</li>
        <li><strong>Keep your contact information current:</strong> Ensure we can reach you quickly if a spot opens</li>
        <li><strong>No action needed:</strong> You don't need to do anything - we will contact you if there's an update</li>
        <li><strong>Stay positive:</strong> Waitlisted applicants often get accepted!</li>
      </ul>
    </div>

    <p>We will notify you as soon as possible if your status changes. Thank you for your patience and understanding.</p>

    <p>If you have any questions, please don't hesitate to reach out to us at <a href="mailto:${EMAIL_CONFIG.support}" style="color: #0d6efd;">${EMAIL_CONFIG.support}</a>.</p>

    <p>Best regards,<br>
    <strong>The IndabaX Kenya Team</strong></p>

    <div class="footer">
      <p>
        <a href="${getWebsiteLinks().home}">Visit Our Website</a> |
        <a href="${getWebsiteLinks().contact}">Contact Us</a>
      </p>
      <p>© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Waitlist email plain text template
 */
export function waitlistEmailTextTemplate(data: WaitlistEmailData): string {
  const { applicantName, eventTitle, notes } = data

  return `
YOU'RE ON THE WAITLIST - ${eventTitle}
${'='.repeat(50)}

Dear ${applicantName},

Thank you for your interest in ${eventTitle} and for taking the time to submit your application.

YOUR STATUS: WAITLISTED
-----------------------
Your application has been placed on our waitlist. This means that while we cannot offer you a confirmed spot at this time due to limited capacity, you may still be considered if spaces become available.

${notes ? `
NOTE FROM OUR TEAM
------------------
${notes}
` : ''}

WHAT DOES BEING ON THE WAITLIST MEAN?
-------------------------------------
- You're still in consideration: If confirmed attendees cancel or additional spots open up, we will reach out to you
- Keep your contact information current: Ensure we can reach you quickly if a spot opens
- No action needed: You don't need to do anything - we will contact you if there's an update
- Stay positive: Waitlisted applicants often get accepted!

We will notify you as soon as possible if your status changes. Thank you for your patience and understanding.

If you have any questions, please don't hesitate to reach out to us at ${EMAIL_CONFIG.support}.

Best regards,
The IndabaX Kenya Team

---
Visit Our Website: ${getWebsiteLinks().home}
Contact Us: ${getWebsiteLinks().contact}

© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.
  `.trim()
}

/**
 * Email subject line for waitlist notification
 */
export function getWaitlistSubject(eventTitle: string): string {
  return `You're on the Waitlist - ${eventTitle}`
}

// ═══════════════════════════════════════════════════════════════════════
// EMAIL VERIFICATION TEMPLATES
// ═══════════════════════════════════════════════════════════════════════

export interface VerificationEmailData {
  name: string
  verificationUrl: string
}

/**
 * Email verification HTML template
 */
export function verificationEmailTemplate(data: VerificationEmailData): string {
  const { name, verificationUrl } = data

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - IndabaX Kenya</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 3px solid #667eea;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 10px;
    }
    h1 {
      color: #667eea;
      margin-top: 30px;
      margin-bottom: 20px;
      font-size: 24px;
    }
    .verify-icon {
      font-size: 64px;
      text-align: center;
      margin: 30px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 40px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .info-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #e9ecef;
      color: #6c757d;
      font-size: 14px;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">IndabaX Kenya</div>
      <p style="margin: 0; color: #6c757d;">Email Verification</p>
    </div>

    <div class="verify-icon">📧</div>

    <h1>Verify Your Email Address</h1>

    <p>Dear ${name},</p>

    <p>Thank you for registering with <strong>IndabaX Kenya</strong>! To complete your registration and access all features, please verify your email address by clicking the button below:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; text-align: center;" target="_blank">
        <span style="color: #ffffff;">Verify Email Address</span>
      </a>
    </div>

    <div class="info-box">
      <strong>⏰ Important:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>This verification link will expire in <strong>24 hours</strong></li>
        <li>If you did not create an account, please ignore this email</li>
      </ul>
    </div>

    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; font-size: 14px; background: #f8f9fa; padding: 10px; border-radius: 4px;">
      <a href="${verificationUrl}" style="color: #3b82f6; text-decoration: underline;" target="_blank">${verificationUrl}</a>
    </p>

    <p>Best regards,<br><strong>The IndabaX Kenya Team</strong></p>

    <div class="footer">
      <p>
        <a href="${getWebsiteLinks().home}">Visit Our Website</a> |
        <a href="${getWebsiteLinks().contact}">Contact Us</a>
      </p>
      <p>© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Email verification plain text template
 */
export function verificationEmailTextTemplate(data: VerificationEmailData): string {
  const { name, verificationUrl } = data

  return `
VERIFY YOUR EMAIL ADDRESS
=========================

Dear ${name},

Thank you for registering with IndabaX Kenya! To complete your registration and access all features, please verify your email address by clicking the link below:

${verificationUrl}

IMPORTANT:
- This verification link will expire in 24 hours
- If you did not create an account, please ignore this email

Best regards,
The IndabaX Kenya Team

---
Visit Our Website: ${getWebsiteLinks().home}
Contact Us: ${getWebsiteLinks().contact}

© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.
  `.trim()
}

/**
 * Email subject line for verification email
 */
export function getVerificationSubject(): string {
  return 'Verify Your Email - IndabaX Kenya'
}

// ═══════════════════════════════════════════════════════════════════════
// WELCOME EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════

export interface WelcomeEmailData {
  name: string
  dashboardUrl: string
}

/**
 * Welcome email HTML template (sent after email verification)
 */
export function welcomeEmailTemplate(data: WelcomeEmailData): string {
  const { name, dashboardUrl } = data

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to IndabaX Kenya!</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 3px solid #28a745;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #28a745;
      margin-bottom: 10px;
    }
    h1 {
      color: #28a745;
      margin-top: 30px;
      margin-bottom: 20px;
      font-size: 24px;
    }
    .welcome-icon {
      font-size: 64px;
      text-align: center;
      margin: 30px 0;
    }
    .feature-box {
      background-color: #e8f5e9;
      border-left: 4px solid #28a745;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .feature-box h3 {
      margin-top: 0;
      color: #28a745;
    }
    .feature-box ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .feature-box li {
      margin: 8px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #28a745;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 40px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #e9ecef;
      color: #6c757d;
      font-size: 14px;
    }
    .footer a {
      color: #28a745;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">IndabaX Kenya</div>
      <p style="margin: 0; color: #6c757d;">Deep Learning Community</p>
    </div>

    <div class="welcome-icon">🎉</div>

    <h1>Welcome to IndabaX Kenya!</h1>

    <p>Dear ${name},</p>

    <p>Your email has been <strong>verified successfully</strong>! You are now a registered member of the IndabaX Kenya community.</p>

    <div class="feature-box">
      <h3>What You Can Do Now:</h3>
      <ul>
        <li><strong>Register for Events:</strong> Browse and apply for upcoming IndabaX events</li>
        <li><strong>Access Your Dashboard:</strong> Track your applications and registrations</li>
        <li><strong>Stay Updated:</strong> Receive notifications about new events and opportunities</li>
        <li><strong>Join the Community:</strong> Connect with AI/ML enthusiasts across Kenya</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff !important; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; text-align: center;" target="_blank">
        <span style="color: #ffffff;">Go to Your Dashboard</span>
      </a>
    </div>

    <p>We're excited to have you join our community of AI and Machine Learning enthusiasts. Stay tuned for upcoming events and opportunities!</p>

    <p>Best regards,<br><strong>The IndabaX Kenya Team</strong></p>

    <div class="footer">
      <p>
        <a href="${getWebsiteLinks().home}">Visit Our Website</a> |
        <a href="${getWebsiteLinks().events}">Browse Events</a> |
        <a href="${getWebsiteLinks().contact}">Contact Us</a>
      </p>
      <p>© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Welcome email plain text template
 */
export function welcomeEmailTextTemplate(data: WelcomeEmailData): string {
  const { name, dashboardUrl } = data

  return `
WELCOME TO INDABAX KENYA!
=========================

Dear ${name},

Your email has been verified successfully! You are now a registered member of the IndabaX Kenya community.

WHAT YOU CAN DO NOW:
--------------------
- Register for Events: Browse and apply for upcoming IndabaX events
- Access Your Dashboard: Track your applications and registrations
- Stay Updated: Receive notifications about new events and opportunities
- Join the Community: Connect with AI/ML enthusiasts across Kenya

Go to Your Dashboard: ${dashboardUrl}

We're excited to have you join our community of AI and Machine Learning enthusiasts. Stay tuned for upcoming events and opportunities!

Best regards,
The IndabaX Kenya Team

---
Visit Our Website: ${getWebsiteLinks().home}
Browse Events: ${getWebsiteLinks().events}
Contact Us: ${getWebsiteLinks().contact}

© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.
  `.trim()
}

/**
 * Email subject line for welcome email
 */
export function getWelcomeSubject(): string {
  return 'Welcome to IndabaX Kenya! 🎉'
}

// ═══════════════════════════════════════════════════════════════════════
// APPLICATION RECEIVED EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════

export interface ApplicationReceivedEmailData {
  name: string
  eventTitle: string
  applicationId: string
}

/**
 * Application received confirmation HTML template
 */
export function applicationReceivedEmailTemplate(data: ApplicationReceivedEmailData): string {
  const { name, eventTitle, applicationId } = data

  // Issue #22 FIX: Shorten application reference to max 15 chars, no hyphens
  // Format: APP + first 12 chars of UUID (uppercase, no hyphens)
  const shortRef = applicationId
    ? `APP${applicationId.replace(/-/g, '').substring(0, 12).toUpperCase()}`
    : ''

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Received - ${eventTitle}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 3px solid #0d6efd;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #0d6efd;
      margin-bottom: 10px;
    }
    h1 {
      color: #0d6efd;
      margin-top: 30px;
      margin-bottom: 20px;
      font-size: 24px;
    }
    .received-icon {
      font-size: 64px;
      text-align: center;
      margin: 30px 0;
    }
    .application-box {
      background-color: #e7f3ff;
      border-left: 4px solid #0d6efd;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .application-box .label {
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .application-box .value {
      font-size: 16px;
      color: #333;
      font-weight: 600;
    }
    .info-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #e9ecef;
      color: #6c757d;
      font-size: 14px;
    }
    .footer a {
      color: #0d6efd;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">IndabaX Kenya</div>
      <p style="margin: 0; color: #6c757d;">Application Confirmation</p>
    </div>

    <div class="received-icon">✅</div>

    <h1>Application Received!</h1>

    <p>Dear ${name},</p>

    <p>Thank you for applying to <strong>${eventTitle}</strong>! We have successfully received your application.</p>

    <div class="application-box">
      <div style="margin-bottom: 15px;">
        <div class="label">Event</div>
        <div class="value">${eventTitle}</div>
      </div>
      <div>
        <div class="label">Application Reference</div>
        <div class="value" style="font-family: monospace; font-weight: bold;">${shortRef}</div>
      </div>
    </div>

    <div class="info-box">
      <strong>📋 What Happens Next?</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Our team will review your application</li>
        <li>You will receive an email notification once a decision is made</li>
        <li>Check your email regularly for updates</li>
      </ul>
    </div>

    <p>Please keep this email for your records. If you have any questions, feel free to reach out to us.</p>

    <p>Best regards,<br><strong>The IndabaX Kenya Team</strong></p>

    <div class="footer">
      <p>
        <a href="${getWebsiteLinks().home}">Visit Our Website</a> |
        <a href="${getWebsiteLinks().contact}">Contact Us</a>
      </p>
      <p>© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Application received plain text template
 */
export function applicationReceivedEmailTextTemplate(data: ApplicationReceivedEmailData): string {
  const { name, eventTitle, applicationId } = data

  // Issue #22 FIX: Shorten application reference to max 15 chars, no hyphens
  const shortRef = applicationId
    ? `APP${applicationId.replace(/-/g, '').substring(0, 12).toUpperCase()}`
    : ''

  return `
APPLICATION RECEIVED
====================

Dear ${name},

Thank you for applying to ${eventTitle}! We have successfully received your application.

APPLICATION DETAILS
-------------------
Event: ${eventTitle}
Application Reference: ${shortRef}

WHAT HAPPENS NEXT?
------------------
- Our team will review your application
- You will receive an email notification once a decision is made
- Check your email regularly for updates

Please keep this email for your records. If you have any questions, feel free to reach out to us.

Best regards,
The IndabaX Kenya Team

---
Visit Our Website: ${getWebsiteLinks().home}
Contact Us: ${getWebsiteLinks().contact}

© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.
  `.trim()
}

/**
 * Email subject line for application received
 */
export function getApplicationReceivedSubject(eventTitle: string): string {
  return `Application Received - ${eventTitle}`
}

// ═══════════════════════════════════════════════════════════════════════
// ADMIN INVITATION EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════

export interface AdminInvitationEmailData {
  email: string
  role: 'admin' | 'super_admin'
  temporaryPassword: string
  loginUrl: string
}

/**
 * Admin invitation HTML template
 */
export function adminInvitationEmailTemplate(data: AdminInvitationEmailData): string {
  const { email, role, temporaryPassword, loginUrl } = data
  const roleName = role === 'super_admin' ? 'Super Administrator' : 'Administrator'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Invitation - IndabaX Kenya</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 3px solid #0d6efd;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #0d6efd;
      margin-bottom: 10px;
    }
    h1 {
      color: #0d6efd;
      margin-top: 30px;
      margin-bottom: 20px;
      font-size: 24px;
    }
    .admin-icon {
      font-size: 64px;
      text-align: center;
      margin: 30px 0;
    }
    .credentials-box {
      background-color: #f8f9fa;
      border: 2px solid #0d6efd;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .credential-item {
      margin-bottom: 15px;
    }
    .credential-item:last-child {
      margin-bottom: 0;
    }
    .credential-label {
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .credential-value {
      font-family: monospace;
      font-size: 16px;
      color: #333;
      background: #e9ecef;
      padding: 10px;
      border-radius: 4px;
      word-break: break-all;
    }
    .warning-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .cta-button {
      display: inline-block;
      background-color: #0d6efd;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 40px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #e9ecef;
      color: #6c757d;
      font-size: 14px;
    }
    .footer a {
      color: #0d6efd;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">IndabaX Kenya Admin</div>
      <p style="margin: 0; color: #6c757d;">Admin Invitation</p>
    </div>

    <div class="admin-icon">🔐</div>

    <h1>Welcome to the Admin Team!</h1>

    <p>Hello,</p>

    <p>You have been invited to join the <strong>IndabaX Kenya</strong> admin team as a <strong>${roleName}</strong>.</p>

    <p>Please use the following credentials to log in:</p>

    <div class="credentials-box">
      <div class="credential-item">
        <div class="credential-label">Email</div>
        <div class="credential-value">${email}</div>
      </div>
      <div class="credential-item">
        <div class="credential-label">Temporary Password</div>
        <div class="credential-value">${temporaryPassword}</div>
      </div>
    </div>

    <div class="warning-box">
      <strong>⚠️ Important Security Notice:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>You will be <strong>required to change your password</strong> on first login</li>
        <li>Do not share this email or your credentials with anyone</li>
        <li>This temporary password will expire after first use</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl}" style="display: inline-block; background-color: #dc3545; color: #ffffff !important; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; text-align: center;" target="_blank">
        <span style="color: #ffffff;">Log In to Admin Panel</span>
      </a>
    </div>

    <p>If you did not expect this invitation, please ignore this email or contact the IndabaX Kenya team.</p>

    <p>Best regards,<br><strong>IndabaX Kenya Team</strong></p>

    <div class="footer">
      <p>This is a confidential invitation. Please do not forward this email.</p>
      <p>© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Admin invitation plain text template
 */
export function adminInvitationEmailTextTemplate(data: AdminInvitationEmailData): string {
  const { email, role, temporaryPassword, loginUrl } = data
  const roleName = role === 'super_admin' ? 'Super Administrator' : 'Administrator'

  return `
WELCOME TO THE INDABAX KENYA ADMIN TEAM
=======================================

Hello,

You have been invited to join the IndabaX Kenya admin team as a ${roleName}.

YOUR LOGIN CREDENTIALS
----------------------
Email: ${email}
Temporary Password: ${temporaryPassword}

Login URL: ${loginUrl}

IMPORTANT SECURITY NOTICE
-------------------------
- You will be REQUIRED to change your password on first login
- Do not share this email or your credentials with anyone
- This temporary password will expire after first use

If you did not expect this invitation, please ignore this email or contact the IndabaX Kenya team.

Best regards,
IndabaX Kenya Team

---
This is a confidential invitation. Please do not forward this email.

© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.
  `.trim()
}

/**
 * Email subject line for admin invitation
 */
export function getAdminInvitationSubject(role: 'admin' | 'super_admin'): string {
  const roleName = role === 'super_admin' ? 'Super Administrator' : 'Administrator'
  return `You've Been Invited as ${roleName} - IndabaX Kenya`
}

// ═══════════════════════════════════════════════════════════════════════
// PASSWORD RESET EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════

export interface PasswordResetEmailData {
  name: string
  resetUrl: string
}

/**
 * Password reset HTML template
 */
export function passwordResetEmailTemplate(data: PasswordResetEmailData): string {
  const { name, resetUrl } = data

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - IndabaX Kenya</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 3px solid #dc3545;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #dc3545;
      margin-bottom: 10px;
    }
    h1 {
      color: #dc3545;
      margin-top: 30px;
      margin-bottom: 20px;
      font-size: 24px;
    }
    .reset-icon {
      font-size: 64px;
      text-align: center;
      margin: 30px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #dc3545;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 40px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .warning-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #e9ecef;
      color: #6c757d;
      font-size: 14px;
    }
    .footer a {
      color: #dc3545;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">IndabaX Kenya</div>
      <p style="margin: 0; color: #6c757d;">Password Reset</p>
    </div>

    <div class="reset-icon">🔑</div>

    <h1>Reset Your Password</h1>

    <p>Dear ${name || 'User'},</p>

    <p>We received a request to reset your password for your IndabaX Kenya account.</p>

    <p>Click the button below to reset your password:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="display: inline-block; background-color: #dc3545; color: #ffffff !important; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 600; font-size: 16px; mso-padding-alt: 0; text-align: center;" target="_blank">
        <!--[if mso]>
        <i style="letter-spacing: 40px; mso-font-width: -100%; mso-text-raise: 30pt;">&nbsp;</i>
        <![endif]-->
        <span style="mso-text-raise: 15pt;">Reset Password</span>
        <!--[if mso]>
        <i style="letter-spacing: 40px; mso-font-width: -100%;">&nbsp;</i>
        <![endif]-->
      </a>
    </div>

    <div class="warning-box">
      <strong>⚠️ Important:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>This link will expire in <strong>1 hour</strong></li>
        <li>If you did not request this reset, please ignore this email</li>
        <li>Your password will not change until you create a new one</li>
      </ul>
    </div>

    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; font-size: 14px; background: #f8f9fa; padding: 10px; border-radius: 4px;">
      <a href="${resetUrl}" style="color: #dc3545; text-decoration: underline;" target="_blank">${resetUrl}</a>
    </p>

    <p>Best regards,<br><strong>The IndabaX Kenya Team</strong></p>

    <div class="footer">
      <p>
        <a href="${getWebsiteLinks().home}">Visit Our Website</a> |
        <a href="${getWebsiteLinks().contact}">Contact Us</a>
      </p>
      <p>© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Password reset plain text template
 */
export function passwordResetEmailTextTemplate(data: PasswordResetEmailData): string {
  const { name, resetUrl } = data

  return `
PASSWORD RESET REQUEST
======================

Dear ${name || 'User'},

We received a request to reset your password for your IndabaX Kenya account.

Click the link below to reset your password:

${resetUrl}

IMPORTANT:
- This link will expire in 1 hour
- If you did not request this reset, please ignore this email
- Your password will not change until you create a new one

Best regards,
The IndabaX Kenya Team

---
Visit Our Website: ${getWebsiteLinks().home}
Contact Us: ${getWebsiteLinks().contact}

© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.
  `.trim()
}

/**
 * Email subject line for password reset
 */
export function getPasswordResetSubject(): string {
  return 'Reset Your Password - IndabaX Kenya'
}

// ═══════════════════════════════════════════════════════════════════════
// PASSWORD CHANGED EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════

export interface PasswordChangedEmailData {
  name: string
}

/**
 * Password changed confirmation HTML template
 */
export function passwordChangedEmailTemplate(data: PasswordChangedEmailData): string {
  const { name } = data

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed - IndabaX Kenya</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 3px solid #28a745;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #28a745;
      margin-bottom: 10px;
    }
    h1 {
      color: #28a745;
      margin-top: 30px;
      margin-bottom: 20px;
      font-size: 24px;
    }
    .success-icon {
      font-size: 64px;
      text-align: center;
      margin: 30px 0;
    }
    .alert-box {
      background-color: #f8d7da;
      border-left: 4px solid #dc3545;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #e9ecef;
      color: #6c757d;
      font-size: 14px;
    }
    .footer a {
      color: #28a745;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">IndabaX Kenya</div>
      <p style="margin: 0; color: #6c757d;">Security Notice</p>
    </div>

    <div class="success-icon">✅</div>

    <h1>Password Changed Successfully</h1>

    <p>Dear ${name || 'User'},</p>

    <p>Your password for IndabaX Kenya has been <strong>successfully changed</strong>.</p>

    <p>If you made this change, no further action is required.</p>

    <div class="alert-box">
      <strong>⚠️ Didn't make this change?</strong>
      <p style="margin: 10px 0 0 0;">If you did not change your password, please contact us immediately at <a href="mailto:${EMAIL_CONFIG.support}" style="color: #dc3545;">${EMAIL_CONFIG.support}</a> as your account may be compromised.</p>
    </div>

    <p>Best regards,<br><strong>The IndabaX Kenya Team</strong></p>

    <div class="footer">
      <p>
        <a href="${getWebsiteLinks().home}">Visit Our Website</a> |
        <a href="${getWebsiteLinks().contact}">Contact Us</a>
      </p>
      <p>© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Password changed plain text template
 */
export function passwordChangedEmailTextTemplate(data: PasswordChangedEmailData): string {
  const { name } = data

  return `
PASSWORD CHANGED SUCCESSFULLY
=============================

Dear ${name || 'User'},

Your password for IndabaX Kenya has been successfully changed.

If you made this change, no further action is required.

DIDN'T MAKE THIS CHANGE?
------------------------
If you did not change your password, please contact us immediately at ${EMAIL_CONFIG.support} as your account may be compromised.

Best regards,
The IndabaX Kenya Team

---
Visit Our Website: ${getWebsiteLinks().home}
Contact Us: ${getWebsiteLinks().contact}

© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.
  `.trim()
}

/**
 * Email subject line for password changed
 */
export function getPasswordChangedSubject(): string {
  return 'Password Changed Successfully - IndabaX Kenya'
}

// ═══════════════════════════════════════════════════════════════════════
// CHECK-IN CONFIRMATION EMAIL TEMPLATES (ISSUE #28)
// ═══════════════════════════════════════════════════════════════════════

export interface CheckInConfirmationEmailData {
  attendeeName: string
  eventTitle: string
  ticketNumber: string
  checkedInAt: string
  eventDate?: string
  eventLocation?: string
}

/**
 * Check-in confirmation email HTML template
 * Sent when an attendee is checked in at the event
 */
export function checkInConfirmationEmailTemplate(data: CheckInConfirmationEmailData): string {
  const { attendeeName, eventTitle, ticketNumber, checkedInAt, eventDate, eventLocation } = data

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${eventTitle}!</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 3px solid #28a745;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #28a745;
      margin-bottom: 10px;
    }
    h1 {
      color: #28a745;
      margin-top: 30px;
      margin-bottom: 20px;
      font-size: 26px;
    }
    .welcome-icon {
      font-size: 64px;
      color: #28a745;
      text-align: center;
      margin: 30px 0;
    }
    .checkin-box {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .checkin-box h2 {
      margin: 0 0 15px 0;
      font-size: 24px;
      color: #ffffff;
    }
    .checkin-box p {
      margin: 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .details-box {
      background-color: #f8f9fa;
      border-left: 4px solid #28a745;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .details-box h3 {
      margin-top: 0;
      color: #28a745;
      font-size: 18px;
    }
    .detail-row {
      margin: 12px 0;
      display: flex;
      align-items: flex-start;
    }
    .detail-label {
      font-weight: 600;
      min-width: 120px;
      color: #555;
    }
    .detail-value {
      color: #333;
      flex: 1;
    }
    .enjoy-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
      text-align: center;
    }
    .enjoy-box h3 {
      margin-top: 0;
      color: #856404;
      font-size: 18px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid #e9ecef;
      color: #6c757d;
      font-size: 14px;
    }
    .footer a {
      color: #28a745;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">IndabaX Kenya</div>
      <p style="margin: 0; color: #6c757d;">Check-In Confirmation</p>
    </div>

    <div class="welcome-icon">✅</div>

    <h1>Welcome, ${attendeeName || 'Attendee'}!</h1>

    <div class="checkin-box">
      <h2>Check-In Confirmed!</h2>
      <p>You have been successfully checked in to ${eventTitle}</p>
    </div>

    <p>Thank you for attending <strong>${eventTitle}</strong>! We're excited to have you here.</p>

    <div class="details-box">
      <h3>📋 Check-In Details</h3>
      <div class="detail-row">
        <span class="detail-label">Event:</span>
        <span class="detail-value"><strong>${eventTitle}</strong></span>
      </div>
      ${eventDate ? `
      <div class="detail-row">
        <span class="detail-label">Date:</span>
        <span class="detail-value">${eventDate}</span>
      </div>
      ` : ''}
      ${eventLocation ? `
      <div class="detail-row">
        <span class="detail-label">Location:</span>
        <span class="detail-value">${eventLocation}</span>
      </div>
      ` : ''}
      <div class="detail-row">
        <span class="detail-label">Ticket:</span>
        <span class="detail-value" style="font-family: monospace;">${ticketNumber}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Checked In:</span>
        <span class="detail-value">${checkedInAt} (EAT)</span>
      </div>
    </div>

    <div class="enjoy-box">
      <h3>🎉 Enjoy the Event!</h3>
      <p style="margin: 10px 0 0 0; color: #664d03;">
        We hope you have an amazing experience. Don't forget to network,
        attend the sessions, and make the most of this opportunity!
      </p>
    </div>

    <p style="margin-top: 30px;">
      If you have any questions during the event, feel free to ask any of our staff members.
    </p>

    <p>
      <strong>Best regards,</strong><br>
      The IndabaX Kenya Team
    </p>

    <div class="footer">
      <p>
        <a href="${getWebsiteLinks().home}">Visit Our Website</a> |
        <a href="${getWebsiteLinks().contact}">Contact Us</a>
      </p>
      <p style="margin: 10px 0; font-size: 12px;">
        This is an automated confirmation of your check-in.
      </p>
      <p style="margin: 10px 0; font-size: 12px;">
        © ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Check-in confirmation plain text template
 */
export function checkInConfirmationEmailTextTemplate(data: CheckInConfirmationEmailData): string {
  const { attendeeName, eventTitle, ticketNumber, checkedInAt, eventDate, eventLocation } = data

  return `
WELCOME TO ${eventTitle.toUpperCase()}!
${'='.repeat(50)}

Dear ${attendeeName || 'Attendee'},

CHECK-IN CONFIRMED!
You have been successfully checked in to ${eventTitle}.

Thank you for attending! We're excited to have you here.

CHECK-IN DETAILS
----------------
Event: ${eventTitle}
${eventDate ? `Date: ${eventDate}\n` : ''}${eventLocation ? `Location: ${eventLocation}\n` : ''}Ticket: ${ticketNumber}
Checked In: ${checkedInAt} (EAT)

ENJOY THE EVENT!
----------------
We hope you have an amazing experience. Don't forget to network,
attend the sessions, and make the most of this opportunity!

If you have any questions during the event, feel free to ask any of our staff members.

Best regards,
The IndabaX Kenya Team

---
Visit Our Website: ${getWebsiteLinks().home}
Contact Us: ${getWebsiteLinks().contact}

This is an automated confirmation of your check-in.

© ${new Date().getFullYear()} Deep Learning IndabaX Kenya. All rights reserved.
  `.trim()
}

/**
 * Email subject line for check-in confirmation
 */
export function getCheckInConfirmationSubject(eventTitle: string): string {
  return `Welcome to ${eventTitle}! Check-In Confirmed ✅`
}
