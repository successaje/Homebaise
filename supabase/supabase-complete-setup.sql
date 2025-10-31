-- Complete Supabase setup for enhanced property system
-- This script sets up all necessary columns and policies

-- ========================================
-- STEP 1: Add role column to profiles table
-- ========================================

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

-- ========================================
-- STEP 2: Add new fields to properties table
-- ========================================

-- Certificate-related columns
ALTER TABLE properties ADD COLUMN IF NOT EXISTS certificate_token_id TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS certificate_number TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS certificate_metadata_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMP WITH TIME ZONE;

-- Investment and property detail arrays
ALTER TABLE properties ADD COLUMN IF NOT EXISTS investment_highlights TEXT[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_features TEXT[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenities TEXT[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS investment_risks TEXT[];

-- Property details fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_size TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS legal_status TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS occupancy_rate DECIMAL(5,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS annual_rental_income DECIMAL(15,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS appreciation_rate DECIMAL(5,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_manager TEXT;

-- Update status constraint safely
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'properties_status_check' 
               AND table_name = 'properties') THEN
        ALTER TABLE properties DROP CONSTRAINT properties_status_check;
    END IF;
EXCEPTION
    WHEN others THEN
        NULL;
END $$ LANGUAGE plpgsql;

-- Add new constraint with all statuses
ALTER TABLE properties ADD CONSTRAINT properties_status_check 
    CHECK (status IN ('draft', 'pending', 'pending_review', 'active', 'funded', 'completed', 'cancelled', 'approved', 'rejected', 'certified'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_certificate ON properties(certificate_token_id);
CREATE INDEX IF NOT EXISTS idx_properties_investment_highlights ON properties USING GIN(investment_highlights);
CREATE INDEX IF NOT EXISTS idx_properties_amenities ON properties USING GIN(amenities);

-- ========================================
-- STEP 3: Update RLS policies
-- ========================================

-- Update properties policies
DROP POLICY IF EXISTS "Properties can be updated by creator or admin" ON properties;

CREATE POLICY "Properties can be updated by creator or admin" ON properties
  FOR UPDATE USING (
    auth.uid() = listed_by OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.kyc_status = 'verified'
    )
  );

-- Add policy for certificate operations (now that role column exists)
CREATE POLICY "Properties can be updated for certificates" ON properties
  FOR UPDATE USING (
    auth.uid() = listed_by OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Update profiles policies
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

-- ========================================
-- STEP 4: Create a default admin user (optional)
-- ========================================

-- Uncomment the following lines to create a default admin user
-- Replace 'your-admin-email@example.com' with the actual admin email
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin-email@example.com'; 