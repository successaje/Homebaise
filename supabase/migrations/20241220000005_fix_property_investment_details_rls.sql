-- Fix RLS policies for property_investment_details table
-- This migration adds the missing INSERT and UPDATE policies

-- Add INSERT policy for property_investment_details
-- Allow inserts when the property is owned by the current user or when triggered by system functions
CREATE POLICY "Enable insert for property owners and system"
ON public.property_investment_details
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.properties 
        WHERE properties.id = property_investment_details.property_id 
        AND (
            properties.listed_by::text = auth.uid()::text
            OR auth.role() = 'service_role'
        )
    )
);

-- Add UPDATE policy for property_investment_details
-- Allow updates when the property is owned by the current user or when triggered by system functions
CREATE POLICY "Enable update for property owners and system"
ON public.property_investment_details
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.properties 
        WHERE properties.id = property_investment_details.property_id 
        AND (
            properties.listed_by::text = auth.uid()::text
            OR auth.role() = 'service_role'
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.properties 
        WHERE properties.id = property_investment_details.property_id 
        AND (
            properties.listed_by::text = auth.uid()::text
            OR auth.role() = 'service_role'
        )
    )
);

-- Add INSERT policy for investment_distributions
CREATE POLICY "Enable insert for property owners and system"
ON public.investment_distributions
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.properties 
        WHERE properties.id = investment_distributions.property_id 
        AND (
            properties.listed_by::text = auth.uid()::text
            OR auth.role() = 'service_role'
        )
    )
);

-- Add UPDATE policy for investment_distributions
CREATE POLICY "Enable update for property owners and system"
ON public.investment_distributions
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.properties 
        WHERE properties.id = investment_distributions.property_id 
        AND (
            properties.listed_by::text = auth.uid()::text
            OR auth.role() = 'service_role'
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.properties 
        WHERE properties.id = investment_distributions.property_id 
        AND (
            properties.listed_by::text = auth.uid()::text
            OR auth.role() = 'service_role'
        )
    )
);

-- Add INSERT policy for investor_earnings
CREATE POLICY "Enable insert for system and investors"
ON public.investor_earnings
FOR INSERT
TO authenticated
WITH CHECK (
    investor_id = auth.uid() 
    OR auth.role() = 'service_role'
);

-- Add UPDATE policy for investor_earnings
CREATE POLICY "Enable update for system and investors"
ON public.investor_earnings
FOR UPDATE
TO authenticated
USING (
    investor_id = auth.uid() 
    OR auth.role() = 'service_role'
)
WITH CHECK (
    investor_id = auth.uid() 
    OR auth.role() = 'service_role'
);

-- Grant necessary permissions for service role
GRANT ALL ON public.property_investment_details TO service_role;
GRANT ALL ON public.investment_distributions TO service_role;
GRANT ALL ON public.investor_earnings TO service_role;

-- Add comment explaining the policies
COMMENT ON TABLE public.property_investment_details IS 'Investment tracking details for properties. RLS allows property owners and system functions to manage records.';
COMMENT ON TABLE public.investment_distributions IS 'Distribution records for property investments. RLS allows property owners and system functions to manage records.';
COMMENT ON TABLE public.investor_earnings IS 'Individual investor earnings tracking. RLS allows investors to view their own records and system functions to manage all records.';
