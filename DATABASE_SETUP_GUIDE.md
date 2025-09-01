# Database Setup Guide

## Current Issue
You're experiencing an **"infinite recursion detected in policy for relation 'profiles'"** error. This means the Row Level Security (RLS) policies in your Supabase database are causing infinite loops.

## Solution
You need to apply the database schema fixes to your Supabase instance.

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project (the one with URL: `zebuyvczvuyehorrydzx.supabase.co`)

### Step 2: Open SQL Editor
1. In your Supabase dashboard, click on **"SQL Editor"** in the left sidebar
2. Click **"New query"** to create a new SQL script

### Step 3: Apply the Fix
1. Copy the entire contents of the `supabase-complete-fix.sql` file
2. Paste it into the SQL Editor
3. Click **"Run"** to execute the script

### Step 4: Verify the Changes
After running the script, you should see:
- No errors in the execution
- A list of columns in the `profiles` table
- A list of current policies

### Step 5: Test the Application
1. Go back to your application at `http://localhost:3001`
2. Try accessing the dashboard or profile page
3. The profile data should now load correctly

## What the Script Does
The `supabase-complete-fix.sql` script:
1. **Adds missing columns** to the `profiles` table (`role`, `hedera_account_id`, etc.)
2. **Fixes RLS policies** to prevent infinite recursion
3. **Updates trigger functions** to handle all profile fields
4. **Creates necessary indexes** for better performance

## If You Still Have Issues
If you continue to see errors after applying the script:
1. Check the SQL Editor for any error messages
2. Make sure you're running the script on the correct project
3. Try refreshing your application and clearing browser cache

## Alternative: Manual Column Addition
If the script fails, you can manually add the missing columns:

```sql
-- Add missing columns one by one
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hedera_account_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hedera_evm_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hedera_private_key TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hedera_public_key TEXT;

-- Update existing profiles
UPDATE profiles SET role = 'user' WHERE role IS NULL;
```

## Need Help?
If you're still experiencing issues after following these steps, please share:
1. Any error messages from the SQL Editor
2. The current state of your `profiles` table structure
3. Any new console errors in your application 