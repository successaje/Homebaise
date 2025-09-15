-- Add token_balance column to property_treasury_accounts
ALTER TABLE public.property_treasury_accounts
ADD COLUMN IF NOT EXISTS token_balance BIGINT DEFAULT 0;

-- Update existing rows to set token_balance based on initial_supply if needed
UPDATE public.property_treasury_accounts pta
SET token_balance = COALESCE(
    (SELECT pid.initial_supply 
     FROM public.property_investment_details pid 
     WHERE pid.property_id = pta.property_id),
    0
)
WHERE pta.token_balance IS NULL OR pta.token_balance = 0;
