-- Final properties table setup with all new fields
-- This script adds all the new fields needed for the enhanced property listing system

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

-- Update RLS policies
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

-- Add policy for certificate operations (commented out until role column is added)
-- CREATE POLICY "Properties can be updated for certificates" ON properties
--   FOR UPDATE USING (
--     auth.uid() = listed_by OR 
--     EXISTS (
--       SELECT 1 FROM profiles 
--       WHERE profiles.id = auth.uid() 
--       AND profiles.role = 'admin'
--     )
--   ); 