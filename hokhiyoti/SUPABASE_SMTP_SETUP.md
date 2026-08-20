# Hokhiyoti Biponi Supabase Custom SMTP Setup with Brevo

## Overview
Configure Supabase Auth to use Brevo as the SMTP provider for branded authentication emails. This ensures Supabase Auth remains the single source of truth for authentication while delivering branded Hokhiyoti Biponi emails.

## Architecture
```
User → Supabase Auth → Brevo SMTP → Branded Hokhiyoti Biponi email → User verifies → Supabase Auth → Authenticated session
```

## Benefits
- ✅ Supabase Auth remains the authority for user creation, verification, and session management
- ✅ Brevo acts only as SMTP delivery provider
- ✅ Branded emails with Hokhiyoti Biponi styling
- ✅ Uses Supabase's official authentication variables ({{ .ConfirmationURL }}, {{ .Token }})
- ✅ No custom verification logic or token generation
- ✅ No Brevo credentials exposed to frontend
- ✅ Existing newsletter system completely separate and untouched

## Configuration Steps

### 1. Brevo SMTP Configuration

#### Get Brevo SMTP Credentials
1. Log in to your Brevo account
2. Navigate to **SMTP & API** → **SMTP keys**
3. Create a new SMTP key or use existing one
4. Note down:
   - **SMTP Server**: `smtp-relay.brevo.com`
   - **Port**: `587` (TLS) or `2525` (alternative)
   - **Username**: Your Brevo SMTP login
   - **Password**: Your Brevo SMTP key

#### Configure Sender Domain
1. In Brevo, go to **Senders** → **Senders**
2. Add and verify your sender domain: `noreply@hokhiyotibiponi.com`
3. Or use Brevo's default sender with your brand name

### 2. Supabase Custom SMTP Configuration

#### Access Supabase Project Settings
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Scroll to **SMTP Settings**

#### Configure SMTP Settings
Fill in the following fields:

**SMTP Host**: `smtp-relay.brevo.com`

**SMTP Port**: `587`

**SMTP User**: Your Brevo SMTP username

**SMTP Password**: Your Brevo SMTP key

**Sender Name**: `Hokhiyoti Biponi`

**Sender Email**: `noreply@hokhiyotibiponi.com` (or your verified sender)

**Reply To**: `support@hokhiyotibiponi.com` (optional)

#### Enable Email Confirmation
1. In **Authentication** → **Providers** → **Email**
2. Toggle **Confirm email** to **ON**
3. Set **Email confirmation grace period** (default: 1 hour)

### 3. Configure Branded Email Templates

Supabase allows you to customize email templates. Use the following branded templates for Hokhiyoti Biponi.

#### Confirm Signup Template
Go to **Authentication** → **Email Templates** → **Confirm signup**

**Subject**: `Verify your email address - Hokhiyoti Biponi`

**HTML Template**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email - Hokhiyoti Biponi</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #B08D57; margin-bottom: 10px; }
    .title { font-size: 20px; color: #111; margin: 0 0 10px 0; }
    .subtitle { color: #666; font-size: 14px; margin: 0; }
    .content { color: #333; line-height: 1.6; margin-bottom: 30px; }
    .button { display: inline-block; background: #B08D57; color: white; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-weight: 500; margin: 20px 0; }
    .button:hover { background: #8B6B47; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
    .link { color: #B08D57; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">Hokhiyoti Biponi</div>
        <h1 class="title">Verify your email address</h1>
        <p class="subtitle">Welcome to the world of Assamese luxury fashion</p>
      </div>
      
      <div class="content">
        <p>Hello,</p>
        <p>Thank you for signing up for Hokhiyoti Biponi. To complete your registration and access your account, please verify your email address by clicking the button below.</p>
        
        <div style="text-align: center;">
          <a href="{{ .ConfirmationURL }}" class="button">Verify Email Address</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666; font-size: 12px;">{{ .ConfirmationURL }}</p>
        
        <p style="font-size: 13px; color: #999;">This link will expire in 1 hour for your security.</p>
        
        <p style="font-size: 13px; color: #999;">If you did not create an account with Hokhiyoti Biponi, please ignore this email.</p>
      </div>
      
      <div class="footer">
        <p>&copy; 2024 Hokhiyoti Biponi. All rights reserved.</p>
        <p>Celebrating the timeless elegance of Assamese textiles</p>
      </div>
    </div>
  </div>
</body>
</html>
```

#### Reset Password Template
Go to **Authentication** → **Email Templates** → **Reset password**

**Subject**: `Reset your password - Hokhiyoti Biponi`

**HTML Template**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password - Hokhiyoti Biponi</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #B08D57; margin-bottom: 10px; }
    .title { font-size: 20px; color: #111; margin: 0 0 10px 0; }
    .subtitle { color: #666; font-size: 14px; margin: 0; }
    .content { color: #333; line-height: 1.6; margin-bottom: 30px; }
    .button { display: inline-block; background: #B08D57; color: white; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-weight: 500; margin: 20px 0; }
    .button:hover { background: #8B6B47; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">Hokhiyoti Biponi</div>
        <h1 class="title">Reset your password</h1>
        <p class="subtitle">Secure account recovery</p>
      </div>
      
      <div class="content">
        <p>Hello,</p>
        <p>We received a request to reset your password for your Hokhiyoti Biponi account. Click the button below to securely reset your password.</p>
        
        <div style="text-align: center;">
          <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666; font-size: 12px;">{{ .ConfirmationURL }}</p>
        
        <p style="font-size: 13px; color: #999;">This link will expire in 1 hour for your security.</p>
        
        <p style="font-size: 13px; color: #999;">If you did not request a password reset, please ignore this email.</p>
      </div>
      
      <div class="footer">
        <p>&copy; 2024 Hokhiyoti Biponi. All rights reserved.</p>
        <p>Celebrating the timeless elegance of Assamese textiles</p>
      </div>
    </div>
  </div>
</body>
</html>
```

#### Email Change Template
Go to **Authentication** → **Email Templates** → **Email change**

**Subject**: `Confirm email change - Hokhiyoti Biponi`

**HTML Template**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm email change - Hokhiyoti Biponi</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; color: #B08D57; margin-bottom: 10px; }
    .title { font-size: 20px; color: #111; margin: 0 0 10px 0; }
    .subtitle { color: #666; font-size: 14px; margin: 0; }
    .content { color: #333; line-height: 1.6; margin-bottom: 30px; }
    .button { display: inline-block; background: #B08D57; color: white; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-weight: 500; margin: 20px 0; }
    .button:hover { background: #8B6B47; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">Hokhiyoti Biponi</div>
        <h1 class="title">Confirm email change</h1>
        <p class="subtitle">Secure account update</p>
      </div>
      
      <div class="content">
        <p>Hello,</p>
        <p>We received a request to change your email address for your Hokhiyoti Biponi account. Click the button below to confirm this change.</p>
        
        <div style="text-align: center;">
          <a href="{{ .ConfirmationURL }}" class="button">Confirm Email Change</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666; font-size: 12px;">{{ .ConfirmationURL }}</p>
        
        <p style="font-size: 13px; color: #999;">This link will expire in 1 hour for your security.</p>
        
        <p style="font-size: 13px; color: #999;">If you did not request this change, please ignore this email.</p>
      </div>
      
      <div class="footer">
        <p>&copy; 2024 Hokhiyoti Biponi. All rights reserved.</p>
        <p>Celebrating the timeless elegance of Assamese textiles</p>
      </div>
    </div>
  </div>
</body>
</html>
```

### 4. Test the Configuration

#### Test Signup Flow
1. Start your application
2. Try to register a new user
3. Check the email for branded Hokhiyoti Biponi verification email
4. Click the verification link
5. Verify the user is confirmed and can log in

#### Test Password Reset
1. Use the "Forgot Password" feature
2. Check for branded password reset email
3. Verify the reset link works

#### Test Email Change
1. Change email in account settings
2. Check both old and new email for confirmation
3. Verify the email change works

## Supabase Authentication Variables
These are the official Supabase variables available in email templates:

- `{{ .ConfirmationURL }}` - The verification/confirmation link
- `{{ .Token }}` - The OTP token (if using email OTP)
- `{{ .Email }}` - The user's email address
- `{{ .Password }}` - The user's password (for new account emails)
- `{{ .SiteURL }}` - Your configured site URL

## Security Notes
- ✅ Brevo SMTP credentials are stored only in Supabase (not in frontend)
- ✅ No hardcoded verification tokens or URLs
- ✅ Supabase handles all security (token generation, expiration, validation)
- ✅ Links expire automatically based on Supabase settings
- ✅ Existing newsletter system completely separate

## Troubleshooting

**Emails not sending:**
- Verify SMTP credentials in Supabase settings
- Check Brevo SMTP key is valid
- Ensure sender domain is verified in Brevo
- Check Supabase logs for SMTP errors

**Emails not branded:**
- Verify email templates are saved in Supabase
- Check that SMTP settings are enabled in Supabase
- Ensure "Confirm email" is toggled ON

**Newsletter broken:**
- Newsletter system is completely separate
- Cloudflare Worker `/newsletter` endpoint unchanged
- Newsletter uses Brevo API, not SMTP
- No changes to newsletter configuration needed

## Current State Summary

### Removed/Reverted
- ❌ `/auth-email` Cloudflare Worker endpoint (removed)
- ❌ `src/services/auth-email.ts` file (deleted)
- ❌ Custom email sending logic in `auth.ts` (reverted)
- ❌ Custom email sending in `AuthModal.tsx` (reverted)
- ❌ `AUTH_EMAIL_IMPLEMENTATION.md` (deleted)

### Remaining Code
- ✅ Existing newsletter system completely untouched
- ✅ Cloudflare Worker `/newsletter` endpoint unchanged
- ✅ Frontend authentication uses standard Supabase Auth
- ✅ No custom verification logic in frontend
- ✅ Supabase Auth handles all authentication flows

### Configuration Required
- ⚙️ **Supabase Dashboard**: Configure Custom SMTP with Brevo credentials
- ⚙️ **Supabase Dashboard**: Set up branded email templates
- ⚙️ **Brevo**: Get SMTP credentials and verify sender domain

### Newsletter System Status
- ✅ **Untouched**: Newsletter system continues to work as before
- ✅ **No Changes**: Cloudflare Worker newsletter endpoint unchanged
- ✅ **No Changes**: Frontend newsletter service unchanged
- ✅ **No Changes**: Newsletter component unchanged