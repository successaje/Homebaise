-- Add token-related columns to properties table
-- This migration adds the missing token columns that are referenced in the investment flow

-- Add token_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'token_id') THEN
        ALTER TABLE properties ADD COLUMN token_id TEXT;
    END IF;
END $$ LANGUAGE plpgsql;

-- Add token_symbol column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'token_symbol') THEN
        ALTER TABLE properties ADD COLUMN token_symbol TEXT;
    END IF;
END $$ LANGUAGE plpgsql;

-- Add token_name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'token_name') THEN
        ALTER TABLE properties ADD COLUMN token_name TEXT;
    END IF;
END $$ LANGUAGE plpgsql;

-- Add token_decimals column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'token_decimals') THEN
        ALTER TABLE properties ADD COLUMN token_decimals INTEGER DEFAULT 8;
    END IF;
END $$ LANGUAGE plpgsql;

-- Add token_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'token_type') THEN
        ALTER TABLE properties ADD COLUMN token_type TEXT DEFAULT 'FUNGIBLE';
    END IF;
END $$ LANGUAGE plpgsql;

-- Add treasury_account_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'treasury_account_id') THEN
        ALTER TABLE properties ADD COLUMN treasury_account_id TEXT;
    END IF;
END $$ LANGUAGE plpgsql;

-- Add treasury_private_key column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'treasury_private_key') THEN
        ALTER TABLE properties ADD COLUMN treasury_private_key TEXT;
    END IF;
END $$ LANGUAGE plpgsql;
