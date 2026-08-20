# Hokhiyoti Biponi - Email OTP Authentication Setup

This document explains how to configure Supabase for email OTP authentication for the Hokhiyoti Biponi website.

## Overview

The website now uses Supabase Auth with email OTP (One-Time Password) authentication. Users can sign in by entering their email address and receiving a 6-digit verification code via email.

## Supabase Dashboard Configuration

### 1. Enable Email Provider

1. Go to your Supabase project dashboard
2. Navigate to **Authentication > Providers**
3. Ensure **Email** provider is enabled (usually enabled by default)
4. Under **Email**, ensure **Confirm email** is **DISABLED** (since we're using OTP, not email confirmation links)
5. Enable **Enable email confirmations** should be OFF for OTP flow

### 2. Configure SMTP Settings (Required for Custom Sender)

To send emails from `hokhiyotibiponi@gmail.com` with the display name "HokhiyotiBiponi", you need to configure SMTP settings:

#### Option A: Use Supabase's Built-in Email Service (Easiest)

1. Go to **Authentication > Providers > Email**
2. Under **SMTP Settings**, you can use Supabase's default email service
3. However, this will send from Supabase's domain, not your custom domain

#### Option B: Configure Custom SMTP (Recommended for Branding)

1. Go to **Authentication > Providers > Email**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Configure the following:

**If using Gmail:**
- **SMTP Host**: `smtp.gmail.com`
- **SMTP Port**: `587`
- **SMTP User**: `hokhiyotibiponi@gmail.com`
- **SMTP Password**: Use an App Password (not your regular password)
  - Go to Google Account Settings > Security > 2-Step Verification
  - Generate an App Password for "Mail"
  - Use this 16-character password in the SMTP Password field
- **Sender Email**: `hokhiyotibiponi@gmail.com`
- **Sender Name**: `HokhiyotiBiponi`

**If using another email provider:**
- Use your provider's SMTP settings
- Common ports: 587 (TLS), 465 (SSL), 25 (non-encrypted)
- Ensure the sender email matches your SMTP username

### 3. Configure Email Templates

You need to customize the email template for the OTP verification code:

1. Go to **Authentication > Email Templates**
2. Find the **"Confirm signup"** template (this is used for OTP)
3. Click **Edit**
4. Customize the email template with the following content:

**Subject:**
```
HokhiyotiBiponi verification code
```

**Email Body (HTML):**
```html
<h2 style="font-family: sans-serif; color: #B08D57;">Welcome to HokhiyotiBiponi</h2>
<p style="font-family: sans-serif; color: #333;">Your verification code is:</p>
<h1 style="font-family: monospace; font-size: 32px; letter-spacing: 8px; color: #111111; margin: 20px 0;">{{ .Token }}</h1>
<p style="font-family: sans-serif; color: #666;">This code will expire in 10 minutes.</p>
<p style="font-family: sans-serif; color: #666;">If you didn't request this code, please ignore this email.</p>
<p style="font-family: sans-serif; color: #666;">Thank you for choosing HokhiyotiBiponi - Your Assamese Fashion Destination</p>
```

**Email Body (Text):**
```
Welcome to HokhiyotiBiponi

Your verification code is: {{ .Token }}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Thank you for choosing HokhiyotiBiponi - Your Assamese Fashion Destination
```

**Important:** Use the `{{ .Token }}` variable - this is Supabase's built-in OTP variable. Do not generate OTPs manually in your code.

### 4. Configure Site URL

1. Go to **Settings > General**
2. Set **Site URL** to your production URL (e.g., `https://hokhiyotibiponi.com`)
3. For local development, you can use `http://localhost:5173`

### 5. Configure Redirect URLs

1. Go to **Authentication > URL Configuration**
2. Under **Redirect URLs**, add:
   - `http://localhost:5173/**` (for local development)
   - `https://your-production-domain.com/**` (for production)
3. This ensures proper redirects after authentication

## Environment Variables

Your `.env` file should already have:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_NEWSLETTER_WORKER_URL=your_newsletter_worker_url
```

**Important:** Never commit the `.env` file. The `.env.example` file contains only placeholder names.

## How It Works

1. **User enters email**: User clicks "Sign In" and enters their email address
2. **OTP sent**: Supabase sends a 6-digit OTP to the user's email via SMTP
3. **User enters OTP**: User enters the 6-digit code in the verification UI
4. **Verification**: The frontend verifies the OTP with Supabase Auth
5. **Session created**: On successful verification, Supabase creates a session
6. **Session persistence**: The session is stored by Supabase and persists across page refreshes
7. **Auto sign-in**: Returning users are automatically signed in if their session is valid

## Security Features

- **No password storage**: Users don't set passwords - only OTP codes are used
- **OTP expiration**: Codes expire after 10 minutes (configurable in Supabase)
- **Rate limiting**: Supabase automatically rate-limits OTP requests
- **Resend cooldown**: Frontend enforces a 60-second cooldown between resend requests
- **Secure session management**: Supabase handles session encryption and storage

## Testing

After configuration:

1. Start the dev server: `npm run dev`
2. Click "Sign In" in the header
3. Enter a real email address
4. Check your email for the 6-digit code
5. Enter the code in the verification UI
6. Verify you're signed in (user email shown in header)
7. Refresh the page - verify session persists
8. Click the user menu and "Sign Out"
9. Verify sign out works

## Troubleshooting

**"Email not received"**
- Check SMTP settings in Supabase Dashboard
- Verify the email isn't in spam folder
- Check Supabase logs (Authentication > Logs)
- For Gmail, ensure you're using an App Password, not your regular password

**"Invalid verification code"**
- Ensure you're entering the complete 6-digit code
- Check that the code hasn't expired (10-minute window)
- Verify the email address matches what received the code

**"SMTP configuration error"**
- Verify SMTP host, port, username, and password are correct
- For Gmail, generate a new App Password
- Check that your email provider allows SMTP access

**"Session not persisting"**
- Check browser console for auth errors
- Verify Site URL is configured correctly in Supabase
- Ensure cookies are enabled in your browser

## Production Checklist

Before going to production:

- [ ] Configure custom SMTP with production email credentials
- [ ] Set production Site URL in Supabase Dashboard
- [ ] Add production redirect URLs
- [ ] Test the complete authentication flow with production settings
- [ ] Verify email template displays correctly
- [ ] Test session persistence across browser sessions
- [ ] Ensure SMTP credentials are secure (use App Passwords, not regular passwords)
- [ ] Monitor Supabase logs for any authentication errors

## Security Notes

- **Never expose service-role keys**: The frontend only uses the anon key
- **SMTP credentials**: Store SMTP credentials in Supabase Dashboard, not in your code
- **Rate limiting**: Supabase automatically rate-limits authentication requests
- **HTTPS**: Always use HTTPS in production for secure authentication
- **Session security**: Supabase handles session encryption and security automatically