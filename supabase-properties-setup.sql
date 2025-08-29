-- Add missing columns to existing properties table (only if they don't exist)
DO $$ 
BEGIN
    -- Add name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'name') THEN
        ALTER TABLE properties ADD COLUMN name TEXT;
    END IF;
    
    -- Add location column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'location') THEN
        ALTER TABLE properties ADD COLUMN location TEXT;
    END IF;
    
    -- Add funded_amount_usd column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'funded_amount_usd') THEN
        ALTER TABLE properties ADD COLUMN funded_amount_usd DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- Add funded_percent column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'funded_percent') THEN
        ALTER TABLE properties ADD COLUMN funded_percent DECIMAL(5,2) DEFAULT 0;
    END IF;
    
    -- Add images column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'images') THEN
        ALTER TABLE properties ADD COLUMN images TEXT[];
    END IF;
    
    -- Add documents column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'documents') THEN
        ALTER TABLE properties ADD COLUMN documents TEXT[];
    END IF;
    
    -- Add approved_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'approved_at') THEN
        ALTER TABLE properties ADD COLUMN approved_at TIMESTAMPTZ;
    END IF;
    
    -- Add approved_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'approved_by') THEN
        ALTER TABLE properties ADD COLUMN approved_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add rejection_reason column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'rejection_reason') THEN
        ALTER TABLE properties ADD COLUMN rejection_reason TEXT;
    END IF;
END $$ LANGUAGE plpgsql;

-- Update existing columns to match new structure
-- Only rename title to name if title exists and name doesn't exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'title') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'name') THEN
        ALTER TABLE properties RENAME COLUMN title TO name;
    END IF;
END $$ LANGUAGE plpgsql;

-- Update status constraint to include new statuses (only if constraint doesn't exist with new values)
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'properties_status_check') THEN
        ALTER TABLE properties DROP CONSTRAINT properties_status_check;
    END IF;
    
    -- Add new constraint
    ALTER TABLE properties ADD CONSTRAINT properties_status_check 
        CHECK (status IN ('draft', 'pending', 'pending_review', 'active', 'funded', 'completed', 'cancelled', 'approved', 'rejected'));
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists with correct values, do nothing
        NULL;
END $$ LANGUAGE plpgsql;

-- Update status values to match new workflow
UPDATE properties SET status = 'pending' WHERE status = 'pending_review';
UPDATE properties SET status = 'active' WHERE status = 'approved';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_country ON properties(country);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_listed_by ON properties(listed_by);

-- Update RLS policies for admin functionality
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
DROP POLICY IF EXISTS "Properties can be created by authenticated users" ON properties;
DROP POLICY IF EXISTS "Properties can be updated by creator or admin" ON properties;
DROP POLICY IF EXISTS "Properties can be deleted by creator or admin" ON properties;

-- Create new policies
CREATE POLICY "Properties are viewable by everyone" ON properties
  FOR SELECT USING (true);

CREATE POLICY "Properties can be created by authenticated users" ON properties
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Properties can be updated by creator or admin" ON properties
  FOR UPDATE USING (
    auth.uid() = listed_by OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.kyc_status = 'verified'
    )
  );

CREATE POLICY "Properties can be deleted by creator or admin" ON properties
  FOR DELETE USING (
    auth.uid() = listed_by OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.kyc_status = 'verified'
    )
  );

-- Insert sample properties if table is empty
DO $$
DECLARE
    user_id UUID;
    property_count INTEGER;
BEGIN
    -- Get the first user ID
    SELECT id INTO user_id FROM auth.users LIMIT 1;
    
    -- Check if properties table is empty
    SELECT COUNT(*) INTO property_count FROM properties;
    
    -- Only insert sample data if table is empty and we have a user
    IF property_count = 0 AND user_id IS NOT NULL THEN
        INSERT INTO properties (
          title,
          description,
          property_type,
          country,
          city,
          address,
          total_value,
          token_price,
          min_investment,
          max_investment,
          yield_rate,
          ipfs_image_cids,
          listed_by,
          status
        ) VALUES 
        (
          'Lagos Marina Luxury Apartments',
          'Premium waterfront apartments in the heart of Lagos with stunning ocean views and world-class amenities.',
          'residential',
          'Nigeria',
          'Lagos',
          'Waterfront, Victoria Island',
          2500000.00,
          1000.00,
          100.00,
          10000.00,
          '8.5%',
          ARRAY['bafybeidemoimagecid1'],
          user_id,
          'active'
        ),
        (
          'Nairobi Tech Hub Office Complex',
          'Modern office complex designed for tech companies with flexible workspaces and cutting-edge facilities.',
          'commercial',
          'Kenya',
          'Nairobi',
          'Upper Hill District',
          1800000.00,
          800.00,
          100.00,
          10000.00,
          '7.2%',
          ARRAY['bafybeidemoimagecid2'],
          user_id,
          'active'
        ),
        (
          'Accra Shopping Mall Development',
          'Multi-story shopping mall with retail spaces, restaurants, and entertainment facilities.',
          'retail',
          'Ghana',
          'Accra',
          'Ring Road Central',
          3200000.00,
          1200.00,
          100.00,
          10000.00,
          '9.1%',
          ARRAY['bafybeidemoimagecid3'],
          user_id,
          'pending'
        ),
        (
          'Cape Town Student Housing',
          'Affordable student accommodation with modern amenities and study spaces.',
          'residential',
          'South Africa',
          'Cape Town',
          'Observatory',
          1200000.00,
          600.00,
          100.00,
          10000.00,
          '6.8%',
          ARRAY['bafybeidemoimagecid4'],
          user_id,
          'active'
        ),
        (
          'Kigali Industrial Park',
          'Industrial development with manufacturing facilities and warehouse spaces.',
          'industrial',
          'Rwanda',
          'Kigali',
          'Special Economic Zone',
          4500000.00,
          1500.00,
          100.00,
          10000.00,
          '10.5%',
          ARRAY['bafybeidemoimagecid5'],
          user_id,
          'draft'
        );

        -- Backfill new columns (if they exist) from legacy columns just inserted
        UPDATE properties SET name = title WHERE name IS NULL AND title IS NOT NULL;
        UPDATE properties SET location = city WHERE location IS NULL AND city IS NOT NULL;
        UPDATE properties SET funded_amount_usd = COALESCE(funded_amount_usd, 0), funded_percent = COALESCE(funded_percent, 0);
    END IF;
END $$ LANGUAGE plpgsql;

-- Optional: Seed additional properties (idempotent)
-- Ensure (name, location) is unique to avoid duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND indexname = 'uniq_properties_name_location'
  ) THEN
    CREATE UNIQUE INDEX uniq_properties_name_location 
      ON properties(name, location);
  END IF;
END $$ LANGUAGE plpgsql;

-- Insert additional sample rows; duplicates (by name,location) will be ignored
INSERT INTO properties (
  title,
  description,
  property_type,
  country,
  city,
  address,
  total_value,
  token_price,
  min_investment,
  max_investment,
  yield_rate,
  ipfs_image_cids,
  listed_by,
  status
)
VALUES
  (
    'Abuja Green Estates',
    'Eco-friendly residential estate with modern amenities and green energy solutions.',
    'residential',
    'Nigeria',
    'Abuja',
    'Gwarinpa District',
    2100000.00,
    700.00,
    100.00,
    10000.00,
    '7.9%',
    ARRAY['bafybeidemoimagecid6'],
    (SELECT id FROM auth.users LIMIT 1),
    'pending'
  ),
  (
    'Mombasa Coastal Villas',
    'Luxury beachfront villas with private access and resort-style facilities.',
    'residential',
    'Kenya',
    'Mombasa',
    'Nyali Beach Road',
    3000000.00,
    1100.00,
    100.00,
    10000.00,
    '8.2%',
    ARRAY['bafybeidemoimagecid7'],
    (SELECT id FROM auth.users LIMIT 1),
    'active'
  ),
  (
    'Johannesburg Logistics Hub',
    'Strategic logistics and warehousing complex near key transport corridors.',
    'industrial',
    'South Africa',
    'Johannesburg',
    'Germiston Logistics Park',
    5200000.00,
    1300.00,
    100.00,
    10000.00,
    '10.1%',
    ARRAY['bafybeidemoimagecid8'],
    (SELECT id FROM auth.users LIMIT 1),
    'draft'
  )
ON CONFLICT (name, location) DO NOTHING;

-- Ensure legacy 'title' column is nullable and backfilled from 'name' if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'title'
  ) THEN
    -- Drop NOT NULL to prevent insert failures when only 'name' is provided
    BEGIN
      ALTER TABLE properties ALTER COLUMN title DROP NOT NULL;
    EXCEPTION WHEN others THEN
      NULL;
    END;

    -- Backfill any NULL titles from name
    UPDATE properties SET title = name WHERE title IS NULL AND name IS NOT NULL;
  END IF;
END $$ LANGUAGE plpgsql;

-- After seeding, ensure 'title' populated from 'name' if still NULL and backfill new columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'title'
  ) THEN
    UPDATE properties SET title = name WHERE title IS NULL AND name IS NOT NULL;
  END IF;
  UPDATE properties SET name = title WHERE name IS NULL AND title IS NOT NULL;
  UPDATE properties SET location = city WHERE location IS NULL AND city IS NOT NULL;
END $$ LANGUAGE plpgsql;