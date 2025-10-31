-- Simple properties table setup for certificate system
-- Add certificate-related columns (will fail gracefully if they already exist)

-- Add certificate_token_id column
ALTER TABLE properties ADD COLUMN IF NOT EXISTS certificate_token_id TEXT;

-- Add certificate_number column  
ALTER TABLE properties ADD COLUMN IF NOT EXISTS certificate_number TEXT;

-- Add certificate_metadata_url column
ALTER TABLE properties ADD COLUMN IF NOT EXISTS certificate_metadata_url TEXT;

-- Add certificate_issued_at column
ALTER TABLE properties ADD COLUMN IF NOT EXISTS certificate_issued_at TIMESTAMP WITH TIME ZONE;

-- Add new property detail fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS investment_highlights TEXT[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_features TEXT[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenities TEXT[];
ALTER TABLE properties ADD COLUMN IF NOT EXISTS investment_risks TEXT[];

-- Add property details object fields
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_size TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS legal_status TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS occupancy_rate DECIMAL(5,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS annual_rental_income DECIMAL(15,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS appreciation_rate DECIMAL(5,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_manager TEXT;

-- Update status constraint to include 'certified' status
-- First drop existing constraint if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'properties_status_check') THEN
        ALTER TABLE properties DROP CONSTRAINT properties_status_check;
    END IF;
EXCEPTION
    WHEN others THEN
        -- Ignore any errors
        NULL;
END $$ LANGUAGE plpgsql;

-- Add new constraint with certified status
ALTER TABLE properties ADD CONSTRAINT properties_status_check 
    CHECK (status IN ('draft', 'pending', 'pending_review', 'active', 'funded', 'completed', 'cancelled', 'approved', 'rejected', 'certified'));

-- Create index for certificate lookups
CREATE INDEX IF NOT EXISTS idx_properties_certificate ON properties(certificate_token_id);

-- Update RLS policies to allow certificate operations
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