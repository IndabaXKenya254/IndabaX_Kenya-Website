#!/bin/bash

# Enable Email Verification via Supabase Management API
# This ensures email confirmation is properly enabled

PROJECT_REF="klnspdwlybpwkznzezzd"
MANAGEMENT_API_TOKEN="sbp_a74d5662addd4101b16e19b0db0c3c5a5276dab6"

curl -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${MANAGEMENT_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "external_email_enabled": true,
    "mailer_secure_email_change_enabled": true,
    "smtp_host": "server72.web-hosting.com",
    "smtp_port": "465",
    "smtp_user": "accounts@deeplearningindabaxkenya.com",
    "smtp_pass": "X5Egh+][4*k$",
    "smtp_admin_email": "accounts@deeplearningindabaxkenya.com",
    "smtp_sender_name": "IndabaX Kenya",
    "mailer_autoconfirm": false
  }'

echo ""
echo "✅ Email verification enabled!"
echo "Test with: curl -X POST http://localhost:3000/api/auth/register ..."
