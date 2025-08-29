-- Add Hedera-related fields to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hedera_evm_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hedera_private_key TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hedera_public_key TEXT;

-- Update the handle_new_user function to include Hedera fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email, provider, hedera_evm_address, hedera_private_key, hedera_public_key)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NULL, -- hedera_evm_address
    NULL, -- hedera_private_key
    NULL  -- hedera_public_key
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    email = EXCLUDED.email,
    provider = EXCLUDED.provider,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_user_update function to include Hedera fields
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    avatar_url = NEW.raw_user_meta_data->>'avatar_url',
    email = NEW.email,
    provider = COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 