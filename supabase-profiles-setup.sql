-- Add role column to profiles table
-- This script adds the role field needed for admin functionality

-- Add role column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Update existing profiles to have 'user' role if they don't have one
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- Add constraint to ensure role is one of the valid values
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'profiles_role_check' 
               AND table_name = 'profiles') THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
    END IF;
EXCEPTION
    WHEN others THEN
        NULL;
END $$ LANGUAGE plpgsql;

-- Add new constraint for role values
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'admin', 'moderator'));

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Update RLS policies to include role-based access
DROP POLICY IF EXISTS "Profiles can be updated by owner" ON profiles;

CREATE POLICY "Profiles can be updated by owner" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Add policy for admin operations
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  ); 