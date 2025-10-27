-- Enable RLS on property_treasury_accounts if not already enabled
ALTER TABLE IF EXISTS public.property_treasury_accounts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read active treasury rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'property_treasury_accounts'
      AND policyname = 'read_active_treasury_for_authenticated'
  ) THEN
    CREATE POLICY "read_active_treasury_for_authenticated"
    ON public.property_treasury_accounts
    FOR SELECT
    TO authenticated
    USING (status = 'active');
  END IF;
END $$;

-- Optional: If you want anon reads (e.g., publicly visible), uncomment below
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_policies
--     WHERE schemaname = 'public'
--       AND tablename = 'property_treasury_accounts'
--       AND policyname = 'read_active_treasury_for_anon'
--   ) THEN
--     CREATE POLICY "read_active_treasury_for_anon"
--     ON public.property_treasury_accounts
--     FOR SELECT
--     TO anon
--     USING (status = 'active');
--   END IF;
-- END $$;


