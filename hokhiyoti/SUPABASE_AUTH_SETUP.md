# Hokhiyoti - Supabase Authentication Setup

This document explains how to set up Supabase Authentication for the Admin Panel.

## Overview

The Admin Panel now uses Supabase Authentication instead of a hardcoded password. This provides:
- Secure email/password authentication
- Session management
- No hardcoded credentials in the frontend

## Setup Instructions

### 1. Enable Authentication in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication > Providers**
3. Enable **Email** provider (usually enabled by default)

### 2. Create an Admin User

You need to create an admin user who can access the admin panel:

**Option A: Via Supabase Dashboard**
1. Go to **Authentication > Users**
2. Click **Add User**
3. Enter email and password
4. Click **Create User**

**Option B: Via SQL Editor**
Run this in your Supabase SQL Editor:
```sql
-- This will create a user with email: admin@hokhiyoti.com
-- You should change the email and password
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'admin@yourdomain.com',
  crypt('your_secure_password', gen_salt('bf')),
  NOW()
);
```

### 3. Configure Environment Variables

Your `.env` file should already have:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These are the same variables used for the database and storage.

### 4. Test the Admin Login

1. Start your development server: `npm run dev`
2. Navigate to `/admin-login`
3. Enter the email and password you created
4. You should be redirected to `/admin`

## How It Works

- **Login**: The login page calls `supabase.auth.signInWithPassword()` with email and password
- **Session**: Supabase manages the session automatically (stored in localStorage by Supabase client)
- **Protection**: The admin page checks `supabase.auth.getUser()` on load
- **Logout**: Calls `supabase.auth.signOut()` to clear the session

## Security Notes

- The admin user credentials are stored securely in Supabase, never in your code
- The anon key is safe to use in the frontend as it only allows authentication operations
- You can enable additional security features like:
  - Email confirmation
  - Two-factor authentication (2FA)
  - Rate limiting
  - IP restrictions (via Supabase dashboard)

## Troubleshooting

**"Invalid login credentials"**
- Check that the user exists in Supabase Authentication > Users
- Verify the email and password are correct
- Ensure email confirmation is disabled or the user's email is confirmed

**"Missing Supabase environment variables"**
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env`
- Restart your development server after adding environment variables

**Redirect loop on admin page**
- Check browser console for authentication errors
- Ensure Supabase project is active and accessible
- Verify the anon key is correct
