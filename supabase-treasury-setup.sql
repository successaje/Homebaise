-- Create property_treasury_accounts table
CREATE TABLE IF NOT EXISTS property_treasury_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    hedera_account_id TEXT NOT NULL UNIQUE,
    hedera_public_key TEXT NOT NULL,
    hedera_private_key TEXT NOT NULL,
    initial_balance_hbar DECIMAL(10,2) DEFAULT 10.0,
    current_balance_hbar DECIMAL(10,2),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_treasury_property_id ON property_treasury_accounts(property_id);
CREATE INDEX IF NOT EXISTS idx_property_treasury_hedera_id ON property_treasury_accounts(hedera_account_id);
CREATE INDEX IF NOT EXISTS idx_property_treasury_status ON property_treasury_accounts(status);

-- Enable RLS
ALTER TABLE property_treasury_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view treasury accounts for their properties" ON property_treasury_accounts
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE listed_by::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert treasury accounts for their properties" ON property_treasury_accounts
    FOR INSERT WITH CHECK (
        property_id IN (
            SELECT id FROM properties WHERE listed_by::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update treasury accounts for their properties" ON property_treasury_accounts
    FOR UPDATE USING (
        property_id IN (
            SELECT id FROM properties WHERE listed_by::text = auth.uid()::text
        )
    );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_property_treasury_accounts_updated_at 
    BEFORE UPDATE ON property_treasury_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add certificate_id column to properties if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'certificate_id') THEN
        ALTER TABLE properties ADD COLUMN certificate_id UUID REFERENCES property_certificates(id);
    END IF;
END $$ LANGUAGE plpgsql; 