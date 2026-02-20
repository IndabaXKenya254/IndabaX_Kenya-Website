import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ConfirmSignupEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  site_url: string
  email: string
}

export const ConfirmSignupEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  site_url,
  email,
}: ConfirmSignupEmailProps) => {
  const confirmationUrl = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`

  return (
    <Html>
      <Head />
      <Preview>Verify your email address to activate your IndabaX Kenya account</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>Welcome to IndabaX Kenya!</Heading>
            <Text style={subtitle}>
              Advancing Machine Learning and AI in Africa
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={text}>
              Thank you for registering with IndabaX Kenya. We're excited to have you join our community of AI enthusiasts, researchers, and practitioners.
            </Text>

            <Text style={text}>
              To complete your registration and activate your account, please verify your email address by clicking the button below:
            </Text>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Link
                href={confirmationUrl}
                target="_blank"
                style={button}
              >
                Verify Email Address
              </Link>
            </Section>

            <Text style={text}>
              Or copy and paste this link into your browser:
            </Text>
            <code style={codeBlock}>{confirmationUrl}</code>

            {/* OTP Alternative */}
            <Text style={text}>
              Alternatively, you can enter this verification code:
            </Text>
            <Section style={otpContainer}>
              <code style={otpCode}>{token}</code>
            </Section>

            <Text style={warningText}>
              ⚠️ This verification link expires in 24 hours.
            </Text>

            <Hr style={divider} />

            <Text style={text}>
              Once verified, you'll be able to:
            </Text>
            <ul style={list}>
              <li style={listItem}>Register for IndabaX and NOAI events</li>
              <li style={listItem}>Access exclusive content and resources</li>
              <li style={listItem}>Connect with the AI community in Kenya</li>
              <li style={listItem}>Receive updates about upcoming workshops and conferences</li>
            </ul>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={divider} />
            <Text style={footerText}>
              If you didn't create an account with IndabaX Kenya, you can safely ignore this email.
            </Text>
            <Text style={footerText}>
              Questions? Contact us at{' '}
              <Link
                href="mailto:accounts@deeplearningindabaxkenya.com"
                style={footerLink}
              >
                accounts@deeplearningindabaxkenya.com
              </Link>
            </Text>
            <Text style={copyright}>
              © {new Date().getFullYear()} IndabaX Kenya. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link
                href={site_url}
                target="_blank"
                style={footerLink}
              >
                Visit our website
              </Link>
              {' • '}
              <Link
                href={`${site_url}/events`}
                target="_blank"
                style={footerLink}
              >
                Upcoming Events
              </Link>
              {' • '}
              <Link
                href={`${site_url}/contact`}
                target="_blank"
                style={footerLink}
              >
                Contact Us
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ConfirmSignupEmail

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  backgroundColor: '#5469d4',
  padding: '32px 24px',
  textAlign: 'center' as const,
}

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  padding: '0',
  lineHeight: '36px',
}

const subtitle = {
  color: '#e6e9f0',
  fontSize: '16px',
  margin: '0',
  padding: '0',
}

const content = {
  padding: '0 24px',
}

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  lineHeight: '1.5',
}

const codeBlock = {
  backgroundColor: '#f4f4f4',
  border: '1px solid #e0e0e0',
  borderRadius: '4px',
  color: '#333333',
  display: 'block',
  fontSize: '12px',
  padding: '12px',
  wordBreak: 'break-all' as const,
  margin: '16px 0',
}

const otpContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const otpCode = {
  backgroundColor: '#f0f4ff',
  border: '2px solid #5469d4',
  borderRadius: '8px',
  color: '#5469d4',
  fontSize: '32px',
  fontWeight: 'bold',
  letterSpacing: '8px',
  padding: '16px 24px',
  display: 'inline-block',
}

const warningText = {
  color: '#856404',
  backgroundColor: '#fff3cd',
  border: '1px solid #ffeaa7',
  borderRadius: '4px',
  fontSize: '14px',
  padding: '12px',
  margin: '24px 0',
}

const divider = {
  borderColor: '#e0e0e0',
  margin: '24px 0',
}

const list = {
  paddingLeft: '20px',
  margin: '16px 0',
}

const listItem = {
  color: '#333333',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
}

const footer = {
  padding: '0 24px',
}

const footerText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
  textAlign: 'center' as const,
}

const footerLink = {
  color: '#5469d4',
  textDecoration: 'underline',
}

const copyright = {
  color: '#999999',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '16px 0 8px',
}
