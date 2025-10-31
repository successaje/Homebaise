-- Property Certificates Setup
-- This script creates the property_certificates table and related functionality

-- 1. Create property_certificates table
CREATE TABLE IF NOT EXISTS public.property_certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  certificate_hash TEXT NOT NULL UNIQUE,
  nft_token_id TEXT,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  issued_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'minted', 'failed')),
  ipfs_metadata_url TEXT,
  ipfs_image_url TEXT,
  approval_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add certificate_id column to properties table
DO $$ BEGIN
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS certificate_id UUID REFERENCES public.property_certificates(id);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_certificates_property_id ON public.property_certificates(property_id);
CREATE INDEX IF NOT EXISTS idx_property_certificates_status ON public.property_certificates(status);
CREATE INDEX IF NOT EXISTS idx_property_certificates_issued_at ON public.property_certificates(issued_at);
CREATE INDEX IF NOT EXISTS idx_property_certificates_certificate_hash ON public.property_certificates(certificate_hash);

-- 4. Enable RLS on property_certificates
ALTER TABLE public.property_certificates ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for property_certificates (with proper type casting)
CREATE POLICY "Users can view own certificates" ON public.property_certificates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE properties.id = property_certificates.property_id 
      AND properties.listed_by::text = auth.uid()::text
    )
  );

CREATE POLICY "Admins can view all certificates" ON public.property_certificates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert certificates" ON public.property_certificates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update certificates" ON public.property_certificates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id::text = auth.uid()::text 
      AND profiles.role = 'admin'
    )
  );

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_property_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for updated_at
DROP TRIGGER IF EXISTS update_property_certificates_updated_at_trigger ON public.property_certificates;
CREATE TRIGGER update_property_certificates_updated_at_trigger
  BEFORE UPDATE ON public.property_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_property_certificates_updated_at();

-- 8. Grant permissions
GRANT ALL ON public.property_certificates TO authenticated;
GRANT ALL ON public.property_certificates TO anon;

-- 9. Verify the setup
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'property_certificates' 
ORDER BY ordinal_position;

-- 10. Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'property_certificates'; 