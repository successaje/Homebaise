-- Add missing columns to profiles table
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hedera_account_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hedera_evm_address TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hedera_private_key TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hedera_public_key TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Add constraint for role if it doesn't exist
DO $$ BEGIN
  ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Update existing profiles to have role = 'user' if role is null
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- Create index on role for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role); 