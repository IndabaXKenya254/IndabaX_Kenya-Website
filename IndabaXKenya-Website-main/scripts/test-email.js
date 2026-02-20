// Test email sending with detailed logging
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testEmail() {
  console.log('🔧 Email Configuration Test\n');

  // Test Applications Email
  console.log('📧 Testing Applications Email Account');
  console.log('─────────────────────────────────────');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_APPLICATIONS_USER);
  console.log('Password:', process.env.SMTP_APPLICATIONS_PASS ? '***' + process.env.SMTP_APPLICATIONS_PASS.slice(-4) : 'NOT SET');
  console.log('From:', process.env.SMTP_APPLICATIONS_FROM_EMAIL);
  console.log('');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // SSL/TLS
    auth: {
      user: process.env.SMTP_APPLICATIONS_USER,
      pass: process.env.SMTP_APPLICATIONS_PASS,
    },
    debug: true, // Enable debug output
    logger: true, // Log to console
  });

  try {
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    console.log('📨 Sending test email...');
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_APPLICATIONS_FROM_NAME}" <${process.env.SMTP_APPLICATIONS_FROM_EMAIL}>`,
      to: 'kelvingithu019@gmail.com', // Change this to your test email
      subject: 'Test Email from IndabaX Kenya',
      text: 'This is a test email to verify SMTP configuration.',
      html: '<p>This is a test email to verify SMTP configuration.</p>',
    });

    console.log('\n✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('\n📬 Check your inbox (and spam folder) for the test email.');

  } catch (error) {
    console.error('\n❌ Email test failed:');
    console.error('Error:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.command) console.error('Command:', error.command);
    if (error.responseCode) console.error('Response Code:', error.responseCode);
  }
}

testEmail();
