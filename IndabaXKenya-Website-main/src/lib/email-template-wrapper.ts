// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PROFESSIONAL EMAIL TEMPLATE WRAPPER
// ═══════════════════════════════════════════════════════════════════════
// Wraps email content with professional inline styles for email clients
// Based on best practices from Litmus, Email on Acid, and modern email design

interface EmailWrapperOptions {
  title?: string
  preheader?: string
  footerText?: string
  unsubscribeLink?: string
  brandColor?: string
}

/**
 * Wraps email HTML content with professional styling
 * Uses inline CSS for maximum email client compatibility
 */
export function wrapEmailWithProfessionalStyling(
  content: string,
  options: EmailWrapperOptions = {}
): string {
  const {
    title = 'IndabaX Kenya',
    preheader = '',
    footerText = 'IndabaX Kenya - Deep Learning Indaba',
    unsubscribeLink = '',
    brandColor = '#3b82f6'
  } = options

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${title}</title>

  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->

  <style>
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }

    /* Prevent Outlook from adding extra spacing */
    .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
      line-height: 100%;
    }

    /* iOS blue links */
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }

    /* Gmail blue links */
    u + #body a {
      color: inherit;
      text-decoration: none;
      font-size: inherit;
      font-family: inherit;
      font-weight: inherit;
      line-height: inherit;
    }

    /* Samsung Mail blue links */
    #MessageViewBody a {
      color: inherit;
      text-decoration: none;
      font-size: inherit;
      font-family: inherit;
      font-weight: inherit;
      line-height: inherit;
    }
  </style>
</head>

<body style="margin: 0; padding: 0; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

  <!-- Preheader (hidden) -->
  ${preheader ? `
  <div style="display: none; max-height: 0px; overflow: hidden;">
    ${preheader}
  </div>
  <div style="display: none; max-height: 0px; overflow: hidden;">
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>
  ` : ''}

  <!-- Email wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0; background-color: #f5f7fa;">
    <tr>
      <td style="padding: 40px 20px;">

        <!-- Main email container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden;">

          <!-- Header (optional brand bar) -->
          <tr>
            <td style="background: linear-gradient(135deg, ${brandColor} 0%, #2563eb 100%); padding: 4px;">
              <!-- Brand accent bar -->
            </td>
          </tr>

          <!-- Main content area -->
          <tr>
            <td style="padding: 48px 40px;">

              <!-- USER CONTENT GOES HERE -->
              <div style="color: #374151; font-size: 16px; line-height: 1.75; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                ${content}
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #f9fafb; border-top: 2px solid #e5e7eb;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    <p style="margin: 0 0 12px 0; font-weight: 600; color: #374151;">
                      ${footerText}
                    </p>
                    <p style="margin: 0; font-size: 13px;">
                      © ${new Date().getFullYear()} IndabaX Kenya. All rights reserved.
                    </p>
                    ${unsubscribeLink ? `
                    <p style="margin: 12px 0 0 0; font-size: 12px;">
                      <a href="${unsubscribeLink}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim()
}

/**
 * Applies inline styles to common HTML elements within email content
 * This ensures consistent styling across all email clients
 */
export function applyInlineStylesToContent(html: string): string {
  // Add inline styles to common elements
  let styled = html

  // Headings
  styled = styled.replace(/<h1([^>]*)>/gi, '<h1$1 style="margin: 28px 0 16px 0; font-size: 32px; font-weight: 700; color: #0f172a; line-height: 1.3; border-bottom: 3px solid #3b82f6; padding-bottom: 12px;">')
  styled = styled.replace(/<h2([^>]*)>/gi, '<h2$1 style="margin: 28px 0 16px 0; font-size: 26px; font-weight: 700; color: #1e293b; line-height: 1.3;">')
  styled = styled.replace(/<h3([^>]*)>/gi, '<h3$1 style="margin: 24px 0 14px 0; font-size: 22px; font-weight: 700; color: #334155; line-height: 1.3;">')
  styled = styled.replace(/<h4([^>]*)>/gi, '<h4$1 style="margin: 20px 0 12px 0; font-size: 18px; font-weight: 700; color: #111827; line-height: 1.3;">')

  // Paragraphs
  styled = styled.replace(/<p([^>]*)>/gi, '<p$1 style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.75; color: #4b5563;">')

  // Links
  styled = styled.replace(/<a([^>]*)>/gi, '<a$1 style="color: #2563eb; text-decoration: underline; font-weight: 500;">')

  // Strong/Bold
  styled = styled.replace(/<strong([^>]*)>/gi, '<strong$1 style="font-weight: 700; color: #111827;">')
  styled = styled.replace(/<b([^>]*)>/gi, '<b$1 style="font-weight: 700; color: #111827;">')

  // Buttons
  styled = styled.replace(/<a([^>]*class="[^"]*btn[^"]*"[^>]*)>/gi, '<a$1 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff !important; border-radius: 8px; text-decoration: none !important; font-weight: 600; font-size: 16px; text-align: center;">')

  // Lists
  styled = styled.replace(/<ul([^>]*)>/gi, '<ul$1 style="margin: 16px 0; padding-left: 24px; list-style-type: disc;">')
  styled = styled.replace(/<ol([^>]*)>/gi, '<ol$1 style="margin: 16px 0; padding-left: 24px; list-style-type: decimal;">')
  styled = styled.replace(/<li([^>]*)>/gi, '<li$1 style="margin-bottom: 8px; line-height: 1.7; color: #4b5563;">')

  // Blockquotes
  styled = styled.replace(/<blockquote([^>]*)>/gi, '<blockquote$1 style="margin: 24px 0; padding: 20px 24px; border-left: 4px solid #3b82f6; background: #eff6ff; font-style: italic; color: #1e40af; border-radius: 0 6px 6px 0;">')

  // Alert boxes
  styled = styled.replace(/<div([^>]*class="[^"]*alert-info[^"]*"[^>]*)>/gi, '<div$1 style="padding: 16px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; background: #eff6ff; color: #1e40af;">')
  styled = styled.replace(/<div([^>]*class="[^"]*alert-success[^"]*"[^>]*)>/gi, '<div$1 style="padding: 16px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; background: #f0fdf4; color: #065f46;">')
  styled = styled.replace(/<div([^>]*class="[^"]*alert-warning[^"]*"[^>]*)>/gi, '<div$1 style="padding: 16px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; background: #fffbeb; color: #92400e;">')
  styled = styled.replace(/<div([^>]*class="[^"]*alert-danger[^"]*"[^>]*)>/gi, '<div$1 style="padding: 16px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; background: #fef2f2; color: #991b1b;">')

  // Horizontal rules
  styled = styled.replace(/<hr([^>]*)>/gi, '<hr$1 style="border: none; height: 2px; background: #e5e7eb; margin: 32px 0;">')

  // Images
  styled = styled.replace(/<img([^>]*)>/gi, '<img$1 style="max-width: 100%; height: auto; border-radius: 6px; margin: 16px 0; display: block;">')

  return styled
}

/**
 * Complete email preparation function
 * Use this when sending emails to ensure professional styling
 */
export function prepareEmailForSending(
  content: string,
  options: EmailWrapperOptions = {}
): string {
  // First apply inline styles to content elements
  const styledContent = applyInlineStylesToContent(content)

  // Then wrap with professional email template
  return wrapEmailWithProfessionalStyling(styledContent, options)
}
