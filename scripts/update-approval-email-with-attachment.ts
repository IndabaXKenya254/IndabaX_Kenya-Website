/**
 * Script to update the approval email template to mention PDF attachment
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
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const TEMPLATE_NAME = 'Application Approved - Welcome to IndabaX Kenya'

const NEW_BODY = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Approved</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a5f2a 0%, #2d8a3e 100%); padding: 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎉 Congratulations!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your Application Has Been Approved</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Dear <strong>{{name}}</strong>,</p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">We are thrilled to inform you that your application for <strong>{{event_title}}</strong> has been <span style="color: #1a5f2a; font-weight: bold;">approved</span>!</p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">Welcome to the IndabaX Kenya community. We are excited to have you join us for this incredible event.</p>

              <!-- Attachment Notice -->
              {{#if ticket_link}}<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #e7f3ff; border-left: 4px solid #0d6efd; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #084298; font-size: 15px; font-weight: bold; margin: 0 0 10px 0;">📎 Your Ticket is Attached!</p>
                    <p style="color: #084298; font-size: 14px; line-height: 1.6; margin: 0;">Your event ticket PDF is attached to this email. You can also download it anytime from your dashboard using the button below.</p>
                  </td>
                </tr>
              </table>{{/if}}

              <!-- Event Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0f9f2; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="color: #1a5f2a; margin: 0 0 15px 0; font-size: 18px;">📅 Event Details</h3>
                    <p style="color: #333333; font-size: 14px; line-height: 1.8; margin: 0;">
                      <strong>Event:</strong> {{event_title}}<br>
                      <strong>Date:</strong> {{event_date}}<br>
                      <strong>Location:</strong> {{event_location}}
                    </p>
                  </td>
                </tr>
              </table>
              <!-- Ticket Download Button -->
              {{#if ticket_link}}<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="{{ticket_link}}" style="display: inline-block; background-color: #d4af37; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">🎫 View Ticket in Dashboard</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="color: #666666; font-size: 13px; margin: 10px 0 0 0;">Download your ticket anytime from your dashboard</p>
                  </td>
                </tr>
              </table>{{/if}}
              <!-- Event Details CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 10px 0 25px 0;">
                    <a href="{{event_url}}" style="display: inline-block; background-color: #1a5f2a; color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 6px; font-weight: bold; font-size: 16px;">View Event Details</a>
                  </td>
                </tr>
              </table>
              <!-- Notes Section -->
              {{#if notes}}<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fff8e6; border-left: 4px solid #f0ad4e; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0;"><strong>Note:</strong> {{notes}}</p>
                  </td>
                </tr>
              </table>{{/if}}
              <h3 style="color: #333333; margin: 25px 0 15px 0; font-size: 18px;">What's Next?</h3>
              <ul style="color: #555555; font-size: 14px; line-height: 1.8; margin: 0 0 20px 0; padding-left: 20px;">
                <li>Your ticket PDF is attached to this email - save it on your device</li>
                <li>Bring your ticket (digital or printed) to the event</li>
                <li>The QR code on your ticket will be scanned at the entrance</li>
                <li>Keep an eye on your email for event updates and schedule</li>
                <li>Join our community channels to connect with other attendees</li>
              </ul>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0;">We look forward to seeing you at the event!</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 25px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">
                <a href="https://deeplearningindabaxkenya.com" style="color: #1a5f2a; text-decoration: none;">Visit Our Website</a> |
                <a href="https://deeplearningindabaxkenya.com/contact" style="color: #1a5f2a; text-decoration: none;">Contact Us</a>
              </p>
              <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0;">Best regards,<br><strong>The IndabaX Kenya Team</strong></p>
              <p style="color: #999999; font-size: 12px; margin: 0;">© 2026 Deep Learning IndabaX Kenya. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

async function updateTemplate() {
  console.log(`🔧 Updating approval email template with PDF attachment notice...\\n`)

  const { data, error } = await supabase
    .from('email_templates')
    .update({ body: NEW_BODY })
    .eq('name', TEMPLATE_NAME)
    .select()

  if (error) {
    console.error('❌ Error updating template:', error)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.error(`❌ Template "${TEMPLATE_NAME}" not found`)
    process.exit(1)
  }

  console.log(`✅ Successfully updated "${TEMPLATE_NAME}"`)
  console.log(`   Template ID: ${data[0].id}`)
  console.log(`\\n📧 Changes made:`)
  console.log(`   ✅ Added "Your Ticket is Attached!" notice box`)
  console.log(`   ✅ Changed button text to "View Ticket in Dashboard"`)
  console.log(`   ✅ Updated instructions to mention PDF attachment`)
  console.log(`   ✅ Added QR code scanning instructions`)
}

updateTemplate()
  .then(() => {
    console.log('\\n✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
