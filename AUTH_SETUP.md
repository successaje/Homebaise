# Authentication Setup Guide

## 🚀 Getting Started with Supabase Authentication

This guide will help you set up authentication for your Homebaise application using Supabase.

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Wait for your project to be ready

### 2. Configure Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project dashboard under Settings > API.

### 3. Configure Authentication Providers

In your Supabase dashboard, go to Authentication > Providers and configure:

#### Email Authentication
- Enable "Enable email confirmations" for sign-up verification
- Configure email templates as needed

#### Social Providers
- **Google**: Add your Google OAuth credentials
- **GitHub**: Add your GitHub OAuth app credentials  
- **Discord**: Add your Discord OAuth app credentials

### 4. Configure Redirect URLs

In your Supabase dashboard, go to Authentication > URL Configuration and add:

```
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
```

For production, add your domain:
```
https://yourdomain.com/auth/callback
```

### 5. Database Schema (Optional)

If you want to store additional user data, create a `profiles` table:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 6. Features Included

✅ **Email/Password Authentication**
- Sign up with email verification
- Sign in with email and password
- Password reset functionality

✅ **Social Authentication**
- Google OAuth
- GitHub OAuth  
- Discord OAuth

✅ **UI Features**
- Beautiful, animated authentication page
- Responsive design
- Loading states and error handling
- Automatic redirects
- Session management

✅ **Security**
- CSRF protection
- Secure session handling
- Environment variable protection

### 7. Usage

Users can now:
1. Visit `/auth` to sign up or sign in
2. Use email/password or social providers
3. Get redirected to `/dashboard` after successful authentication
4. Sign out from the dashboard

### 8. Customization

You can customize the authentication page by editing:
- `src/app/auth/page.tsx` - Main authentication UI
- `src/app/dashboard/page.tsx` - Dashboard for authenticated users
- `src/lib/supabase.ts` - Supabase client configuration

### 9. Troubleshooting

**Common Issues:**
- Make sure environment variables are set correctly
- Check that redirect URLs are configured in Supabase
- Ensure social providers are properly configured
- Verify email templates are set up for email verification

**Need Help?**
- Check the [Supabase documentation](https://supabase.com/docs)
- Review the [Next.js Supabase integration guide](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs) 