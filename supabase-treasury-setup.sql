-- Create property_treasury_accounts table
CREATE TABLE IF NOT EXISTS property_treasury_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    private_key TEXT NOT NULL,
    token_id TEXT,
    token_type TEXT CHECK (token_type IN ('FUNGIBLE', 'NON_FUNGIBLE')),
    initial_balance_hbar DECIMAL(10,2) DEFAULT 10.0,
    current_balance_hbar DECIMAL(10,2),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_treasury_property_id ON property_treasury_accounts(property_id);
CREATE INDEX IF NOT EXISTS idx_property_treasury_account_id ON property_treasury_accounts(account_id);
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

-- Add missing columns to properties table for tokenization
DO $$ 
BEGIN
    -- Add is_tokenized column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'is_tokenized') THEN
        ALTER TABLE properties ADD COLUMN is_tokenized BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add token_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'token_id') THEN
        ALTER TABLE properties ADD COLUMN token_id TEXT;
    END IF;
    
    -- Add token_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'token_type') THEN
        ALTER TABLE properties ADD COLUMN token_type TEXT CHECK (token_type IN ('FUNGIBLE', 'NON_FUNGIBLE'));
    END IF;
    
    -- Add token_symbol column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'token_symbol') THEN
        ALTER TABLE properties ADD COLUMN token_symbol TEXT;
    END IF;
    
    -- Add token_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'token_name') THEN
        ALTER TABLE properties ADD COLUMN token_name TEXT;
    END IF;
    
    -- Add token_decimals column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'token_decimals') THEN
        ALTER TABLE properties ADD COLUMN token_decimals INTEGER;
    END IF;
    
    -- Add certificate_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'certificate_id') THEN
        ALTER TABLE properties ADD COLUMN certificate_id UUID REFERENCES property_certificates(id);
    END IF;
END $$ LANGUAGE plpgsql; 