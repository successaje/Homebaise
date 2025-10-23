-- Add phone_number column to profiles table
-- This enables WhatsApp and Telegram bot integration for easier onboarding

-- Add phone_number column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add index for phone number lookups (useful for bot integrations)
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number);

-- Add comment to document the purpose
COMMENT ON COLUMN public.profiles.phone_number IS 'User phone number for WhatsApp/Telegram bot integration and easier onboarding';

-- Note: Phone number format validation is handled at the application level
-- This allows for flexible international formats and better user experience

-- Update RLS policies if needed (phone number should be private to the user)
-- The existing RLS policies should already handle this, but let's ensure phone_number is included

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
