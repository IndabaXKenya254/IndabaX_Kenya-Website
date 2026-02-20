// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - PREMIUM EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════
// World-class email styling inspired by Stripe, Linear, Notion, Vercel
// Multiple design themes for different email types

export type EmailTheme = 'modern' | 'gradient' | 'minimal' | 'bold'

interface PremiumEmailOptions {
  theme?: EmailTheme
  title?: string
  preheader?: string
  brandLogo?: string
  brandName?: string
  accentColor?: string
  headerTitle?: string
  headerSubtitle?: string
  footerText?: string
  footerLinks?: { label: string; url: string }[]
  showBrandBar?: boolean
}

/**
 * PREMIUM EMAIL TEMPLATE - MODERN THEME
 * Clean, professional design with subtle gradients and shadows
 */
function createModernTemplate(content: string, options: PremiumEmailOptions): string {
  const {
    title = 'IndabaX Kenya',
    preheader = '',
    brandName = 'IndabaX Kenya',
    accentColor = '#3b82f6',
    headerTitle = '',
    footerLinks = []
  } = options

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .email-wrapper { background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%); padding: 40px 20px; }
    .email-container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12); overflow: hidden; }
    .brand-bar { height: 6px; background: linear-gradient(90deg, ${accentColor} 0%, #8b5cf6 100%); }
    .header { padding: 48px 48px 32px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); }
    .header-title { font-size: 32px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -0.02em; }
    .header-subtitle { font-size: 16px; color: #64748b; margin: 0; }
    .content { padding: 40px 48px; color: #334155; font-size: 16px; line-height: 1.75; }
    .content h1 { font-size: 28px; font-weight: 700; color: #0f172a; margin: 0 0 20px 0; }
    .content h2 { font-size: 24px; font-weight: 700; color: #1e293b; margin: 32px 0 16px 0; }
    .content h3 { font-size: 20px; font-weight: 600; color: #334155; margin: 28px 0 12px 0; }
    .content p { margin: 0 0 20px 0; color: #475569; }
    .content a { color: ${accentColor}; text-decoration: none; font-weight: 500; border-bottom: 1px solid rgba(59, 130, 246, 0.3); }
    .content a:hover { border-bottom-color: ${accentColor}; }
    .content strong { font-weight: 600; color: #0f172a; }
    .btn { display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, ${accentColor} 0%, #2563eb 100%); color: #ffffff !important; text-decoration: none !important; border-radius: 10px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4); transition: all 0.3s ease; border: none; }
    .btn:hover { box-shadow: 0 8px 24px rgba(59, 130, 246, 0.5); transform: translateY(-2px); }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .alert-info { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid ${accentColor}; padding: 20px 24px; border-radius: 8px; margin: 24px 0; }
    .alert-success { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 4px solid #10b981; padding: 20px 24px; border-radius: 8px; margin: 24px 0; }
    .footer { background: #0f172a; color: #94a3b8; padding: 40px 48px; text-align: center; font-size: 14px; }
    .footer-brand { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
    .footer-links { margin: 20px 0; }
    .footer-links a { color: #cbd5e1; text-decoration: none; margin: 0 12px; }
    .footer-copyright { color: #64748b; font-size: 13px; margin-top: 20px; }
    @media only screen and (max-width: 640px) {
      .header, .content, .footer { padding: 32px 24px !important; }
      .header-title { font-size: 26px !important; }
      .btn { width: 100%; padding: 14px 24px !important; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0px;overflow:hidden;">${preheader}</div>` : ''}

  <div class="email-wrapper">
    <div class="email-container">
      <div class="brand-bar"></div>

      ${headerTitle ? `
      <div class="header">
        <h1 class="header-title">${headerTitle}</h1>
        ${options.headerSubtitle ? `<p class="header-subtitle">${options.headerSubtitle}</p>` : ''}
      </div>
      ` : ''}

      <div class="content">
        ${content}
      </div>

      <div class="footer">
        <div class="footer-brand">${brandName}</div>
        <p style="color: #94a3b8; margin: 8px 0 0 0;">Deep Learning Indaba</p>

        ${footerLinks.length > 0 ? `
        <div class="footer-links">
          ${footerLinks.map(link => `<a href="${link.url}">${link.label}</a>`).join('')}
        </div>
        ` : ''}

        <div class="footer-copyright">
          © ${new Date().getFullYear()} IndabaX Kenya. All rights reserved.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * PREMIUM EMAIL TEMPLATE - GRADIENT THEME
 * Bold, eye-catching design with vibrant gradients (for announcements, marketing)
 */
function createGradientTemplate(content: string, options: PremiumEmailOptions): string {
  const {
    title = 'IndabaX Kenya',
    preheader = '',
    brandName = 'IndabaX Kenya',
    headerTitle = '',
    footerLinks = []
  } = options

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #0f172a; }
    .email-wrapper { padding: 40px 20px; }
    .email-container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }
    .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); padding: 60px 48px; text-align: center; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); animation: pulse 15s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
    .hero-title { font-size: 40px; font-weight: 800; color: #ffffff; margin: 0 0 12px 0; text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2); position: relative; z-index: 1; letter-spacing: -0.03em; }
    .hero-subtitle { font-size: 18px; color: rgba(255, 255, 255, 0.95); margin: 0; position: relative; z-index: 1; }
    .content { padding: 48px; color: #334155; font-size: 16px; line-height: 1.75; }
    .content h2 { font-size: 26px; font-weight: 700; color: #0f172a; margin: 32px 0 16px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .content p { margin: 0 0 20px 0; color: #475569; }
    .content a { color: #667eea; text-decoration: none; font-weight: 600; }
    .btn { display: inline-block; padding: 18px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none !important; border-radius: 12px; font-weight: 700; font-size: 17px; text-align: center; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4); margin: 20px 0; }
    .highlight-box { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 28px; margin: 28px 0; border: 2px solid #fbbf24; box-shadow: 0 4px 16px rgba(251, 191, 36, 0.2); }
    .footer { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #94a3b8; padding: 48px; text-align: center; }
    .footer-brand { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 16px; }
    @media only screen and (max-width: 640px) {
      .hero { padding: 40px 24px !important; }
      .hero-title { font-size: 32px !important; }
      .content { padding: 32px 24px !important; }
      .btn { width: 100%; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0px;overflow:hidden;">${preheader}</div>` : ''}

  <div class="email-wrapper">
    <div class="email-container">
      ${headerTitle ? `
      <div class="hero">
        <h1 class="hero-title">${headerTitle}</h1>
        ${options.headerSubtitle ? `<p class="hero-subtitle">${options.headerSubtitle}</p>` : ''}
      </div>
      ` : ''}

      <div class="content">
        ${content}
      </div>

      <div class="footer">
        <div class="footer-brand">${brandName}</div>
        <p style="color: #94a3b8; margin: 8px 0 20px 0;">Deep Learning Indaba</p>
        ${footerLinks.length > 0 ? `
        <div style="margin: 24px 0;">
          ${footerLinks.map(link => `<a href="${link.url}" style="color: #cbd5e1; text-decoration: none; margin: 0 12px;">${link.label}</a>`).join('')}
        </div>
        ` : ''}
        <div style="color: #64748b; font-size: 13px; margin-top: 24px;">
          © ${new Date().getFullYear()} IndabaX Kenya. All rights reserved.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * PREMIUM EMAIL TEMPLATE - MINIMAL THEME
 * Ultra-clean, Notion/Linear-inspired design
 */
function createMinimalTemplate(content: string, options: PremiumEmailOptions): string {
  const {
    title = 'IndabaX Kenya',
    preheader = '',
    brandName = 'IndabaX Kenya',
    accentColor = '#3b82f6',
    headerTitle = ''
  } = options

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #fafafa; }
    .email-container { max-width: 600px; margin: 60px auto; background: #ffffff; border: 1px solid #e5e5e5; }
    .header { padding: 48px 48px 0; border-bottom: 1px solid #f5f5f5; }
    .brand { font-size: 14px; font-weight: 600; color: #171717; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 32px; }
    .header-title { font-size: 28px; font-weight: 600; color: #171717; margin: 0 0 40px 0; line-height: 1.3; }
    .content { padding: 40px 48px; color: #525252; font-size: 15px; line-height: 1.7; }
    .content p { margin: 0 0 24px 0; }
    .content a { color: #171717; font-weight: 500; text-decoration: underline; text-decoration-color: #d4d4d4; text-underline-offset: 3px; }
    .content a:hover { text-decoration-color: #171717; }
    .btn { display: inline-block; padding: 12px 24px; background: #171717; color: #ffffff !important; text-decoration: none !important; border-radius: 6px; font-weight: 500; font-size: 14px; margin: 8px 0; }
    .divider { height: 1px; background: #f5f5f5; margin: 32px 0; }
    .footer { padding: 32px 48px; background: #fafafa; border-top: 1px solid #f5f5f5; text-align: center; color: #a3a3a3; font-size: 13px; }
    @media only screen and (max-width: 640px) {
      .email-container { margin: 20px; }
      .header, .content, .footer { padding-left: 24px !important; padding-right: 24px !important; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0px;overflow:hidden;">${preheader}</div>` : ''}

  <div class="email-container">
    <div class="header">
      <div class="brand">${brandName}</div>
      ${headerTitle ? `<h1 class="header-title">${headerTitle}</h1>` : ''}
    </div>

    <div class="content">
      ${content}
    </div>

    <div class="footer">
      <p style="margin: 0 0 8px 0;">© ${new Date().getFullYear()} IndabaX Kenya</p>
      <p style="margin: 0; color: #d4d4d4;">Deep Learning Indaba</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Main function to create premium emails
 */
export function createPremiumEmail(
  content: string,
  options: PremiumEmailOptions = {}
): string {
  const theme = options.theme || 'modern'

  // Apply inline styles to content elements first
  let styledContent = applyPremiumInlineStyles(content, options.accentColor || '#3b82f6')

  // Then wrap with selected theme
  switch (theme) {
    case 'gradient':
      return createGradientTemplate(styledContent, options)
    case 'minimal':
      return createMinimalTemplate(styledContent, options)
    case 'modern':
    default:
      return createModernTemplate(styledContent, options)
  }
}

/**
 * Apply inline styles to content elements
 */
function applyPremiumInlineStyles(html: string, accentColor: string): string {
  let styled = html

  // Headings
  styled = styled.replace(/<h1([^>]*)>/gi, '<h1$1 style="font-size: 28px; font-weight: 700; color: #0f172a; margin: 0 0 20px 0; line-height: 1.3;">')
  styled = styled.replace(/<h2([^>]*)>/gi, '<h2$1 style="font-size: 24px; font-weight: 700; color: #1e293b; margin: 32px 0 16px 0; line-height: 1.3;">')
  styled = styled.replace(/<h3([^>]*)>/gi, '<h3$1 style="font-size: 20px; font-weight: 600; color: #334155; margin: 28px 0 12px 0; line-height: 1.3;">')

  // Paragraphs
  styled = styled.replace(/<p([^>]*)>/gi, '<p$1 style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.75; color: #475569;">')

  // Lists
  styled = styled.replace(/<ul([^>]*)>/gi, '<ul$1 style="margin: 20px 0; padding-left: 24px; list-style-type: disc;">')
  styled = styled.replace(/<ol([^>]*)>/gi, '<ol$1 style="margin: 20px 0; padding-left: 24px;">')
  styled = styled.replace(/<li([^>]*)>/gi, '<li$1 style="margin-bottom: 12px; line-height: 1.7; color: #475569;">')

  // Strong
  styled = styled.replace(/<strong([^>]*)>/gi, '<strong$1 style="font-weight: 600; color: #0f172a;">')

  // Blockquotes
  styled = styled.replace(/<blockquote([^>]*)>/gi, `<blockquote$1 style="margin: 24px 0; padding: 20px 24px; border-left: 4px solid ${accentColor}; background: #f8fafc; font-style: italic; color: #334155; border-radius: 0 8px 8px 0;">`)

  // Tables
  styled = styled.replace(/<table([^>]*)>/gi, '<table$1 style="width: 100%; border-collapse: collapse; margin: 24px 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">')
  styled = styled.replace(/<th([^>]*)>/gi, '<th$1 style="padding: 14px 18px; text-align: left; background: #f8fafc; font-weight: 600; color: #0f172a; border-bottom: 1px solid #e2e8f0;">')
  styled = styled.replace(/<td([^>]*)>/gi, '<td$1 style="padding: 14px 18px; border-bottom: 1px solid #f1f5f9; color: #334155;">')

  // Images
  styled = styled.replace(/<img([^>]*)>/gi, '<img$1 style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; display: block;">')

  // Horizontal rules
  styled = styled.replace(/<hr([^>]*)>/gi, '<hr$1 style="border: none; height: 1px; background: #e2e8f0; margin: 32px 0;">')

  return styled
}
