-- Add Hedera-related columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS hedera_evm_address TEXT,
ADD COLUMN IF NOT EXISTS hedera_private_key TEXT,
ADD COLUMN IF NOT EXISTS hedera_public_key TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_hedera_evm_address ON profiles(hedera_evm_address);

-- Add comments for documentation
COMMENT ON COLUMN profiles.hedera_evm_address IS 'EVM address of the user''s Hedera account';
COMMENT ON COLUMN profiles.hedera_private_key IS 'Private key of the user''s Hedera account (should be encrypted in production)';
COMMENT ON COLUMN profiles.hedera_public_key IS 'Public key of the user''s Hedera account'; 