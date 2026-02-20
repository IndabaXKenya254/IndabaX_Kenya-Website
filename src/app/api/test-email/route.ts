export const dynamic = 'force-dynamic'

// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - TEST EMAIL API
// ═══════════════════════════════════════════════════════════════════════
// Test endpoint for email configuration
// Phase 4: Registration Flow

import { NextRequest, NextResponse } from 'next/server'
import { testEmailConfiguration, sendEmail } from '@/lib/email/sender'
import { createServerClient } from '@/lib/supabase'
import type { ApiSuccessResponse } from '@/types/api'

/**
 * GET /api/test-email
 * Test email configuration for all accounts
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
        },
        { status: 403 }
      )
    }

    const { getAvailableEmailAccounts } = await import('@/lib/email/sender')

    // Test both accounts
    const applicationsResult = await testEmailConfiguration('applications')
    const accountsResult = await testEmailConfiguration('accounts')
    const availableAccounts = getAvailableEmailAccounts()

    const isSuccess = applicationsResult.success || accountsResult.success

    // Return appropriate response based on test results
    return NextResponse.json({
      success: isSuccess,
      data: {
        host: process.env.SMTP_HOST || 'server72.web-hosting.com',
        port: process.env.SMTP_PORT || '465',
        accounts: availableAccounts,
        tests: {
          applications: applicationsResult,
          accounts: accountsResult,
        },
      },
    }, { status: isSuccess ? 200 : 500 })
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to test email configuration',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/test-email
 * Send a test email
 * Body: { email: string, accountType?: 'applications' | 'accounts' }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const testEmail = body.email || profile.email
    const accountType = body.accountType || 'applications' // Default to applications

    if (!testEmail) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email address is required',
          },
        },
        { status: 400 }
      )
    }

    // Send test email using specified account
    const sent = await sendEmail({
      to: testEmail,
      subject: `Test Email from IndabaX Kenya (${accountType})`,
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from the IndabaX Kenya registration system.</p>
        <p>Sent from <strong>${accountType}@deeplearningindabaxkenya.com</strong></p>
        <p>If you received this email, your SMTP configuration is working correctly!</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
      `,
      text: `
        Test Email

        This is a test email from the IndabaX Kenya registration system.
        Sent from ${accountType}@deeplearningindabaxkenya.com
        If you received this email, your SMTP configuration is working correctly!

        Timestamp: ${new Date().toLocaleString()}
      `,
      accountType: accountType as 'applications' | 'accounts',
    })

    // Return appropriate response based on email send result
    return NextResponse.json({
      success: sent,
      data: {
        sent,
        recipient: testEmail,
        timestamp: new Date().toISOString(),
      },
      message: sent
        ? 'Test email sent successfully'
        : 'Failed to send test email',
    }, { status: sent ? 200 : 500 })
  } catch (error) {
    console.error('Send test email error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send test email',
        },
      },
      { status: 500 }
    )
  }
}
