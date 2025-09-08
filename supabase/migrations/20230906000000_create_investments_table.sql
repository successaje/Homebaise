-- Create investments table
CREATE TABLE IF NOT EXISTS public.investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(18, 2) NOT NULL,
    tokens_purchased INTEGER NOT NULL,
    token_price NUMERIC(18, 6) NOT NULL,
    transaction_hash TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS investments_property_id_idx ON public.investments(property_id);
CREATE INDEX IF NOT EXISTS investments_investor_id_idx ON public.investments(investor_id);
CREATE INDEX IF NOT EXISTS investments_status_idx ON public.investments(status);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_investments_updated_at
BEFORE UPDATE ON public.investments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Enable read access for authenticated users"
ON public.investments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.investments
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for owners"
ON public.investments
FOR UPDATE
TO authenticated
USING (investor_id = auth.uid())
WITH CHECK (investor_id = auth.uid());

-- Note: investment_summaries view is created in the second migration
-- after property_investment_details table is created
