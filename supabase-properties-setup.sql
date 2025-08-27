-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  total_value DECIMAL(20,2) NOT NULL,
  token_price DECIMAL(10,2) NOT NULL,
  min_investment DECIMAL(10,2) NOT NULL,
  max_investment DECIMAL(10,2) NOT NULL,
  yield_rate TEXT,
  ipfs_metadata_cid TEXT,
  ipfs_image_cids TEXT[],
  ipfs_document_cids TEXT[],
  listed_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'active', 'sold')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all approved properties" ON properties
  FOR SELECT USING (status = 'approved' OR status = 'active' OR status = 'sold');

CREATE POLICY "Users can view their own properties" ON properties
  FOR SELECT USING (auth.uid() = listed_by);

CREATE POLICY "Verified users can create properties" ON properties
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.kyc_status = 'verified'
    )
  );

CREATE POLICY "Users can update their own properties" ON properties
  FOR UPDATE USING (auth.uid() = listed_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_properties_updated_at 
  BEFORE UPDATE ON properties 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_listed_by ON properties(listed_by);
CREATE INDEX IF NOT EXISTS idx_properties_country ON properties(country);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type); 