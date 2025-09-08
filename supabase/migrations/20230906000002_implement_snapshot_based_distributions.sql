-- Add snapshot_balance to investor_earnings table
ALTER TABLE public.investor_earnings
ADD COLUMN snapshot_balance BIGINT NOT NULL DEFAULT 0;

-- Drop and recreate the investor_earnings table with proper constraints
DROP TRIGGER IF EXISTS update_updated_at_column ON public.investor_earnings;

CREATE OR REPLACE FUNCTION create_distribution_snapshot()
RETURNS TRIGGER AS $$
DECLARE
    investor_record RECORD;
    total_tokens BIGINT;
    distribution_amount_per_token NUMERIC(18, 6);
BEGIN
    -- Calculate amount per token for this distribution
    distribution_amount_per_token := NEW.amount_per_token;
    
    -- Get all investors with completed investments for this property
    FOR investor_record IN 
        SELECT 
            i.investor_id,
            i.id as investment_id,
            SUM(i.tokens_purchased) as total_tokens
        FROM 
            public.investments i
        WHERE 
            i.property_id = NEW.property_id
            AND i.status = 'completed'
            AND i.created_at <= NEW.distribution_date
        GROUP BY 
            i.investor_id, i.id
    LOOP
        -- Insert earnings record with snapshot balance
        INSERT INTO public.investor_earnings (
            investment_id,
            distribution_id,
            investor_id,
            tokens_owned_at_distribution,
            snapshot_balance,
            amount_earned,
            paid,
            created_at,
            updated_at
        ) VALUES (
            investor_record.investment_id,
            NEW.id,
            investor_record.investor_id,
            investor_record.total_tokens,
            investor_record.total_tokens, -- Store the same value in snapshot_balance for consistency
            investor_record.total_tokens * distribution_amount_per_token,
            false, -- Not paid by default
            NOW(),
            NOW()
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS process_distribution_trigger ON public.investment_distributions;

-- Create trigger to process distributions
CREATE TRIGGER process_distribution_trigger
AFTER INSERT ON public.investment_distributions
FOR EACH ROW
EXECUTE FUNCTION create_distribution_snapshot();

-- Update the update_property_investment_details function to handle token transfers
CREATE OR REPLACE FUNCTION update_property_investment_details()
RETURNS TRIGGER AS $$
BEGIN
    -- Update property_investment_details when an investment is completed
    IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
        UPDATE public.property_investment_details
        SET 
            tokens_sold = tokens_sold + NEW.tokens_purchased,
            tokens_available = tokens_available - NEW.tokens_purchased,
            amount_raised = amount_raised + NEW.amount,
            updated_at = NOW()
        WHERE property_id = NEW.property_id;
    
    -- Handle updates to existing investments
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status = 'completed' THEN
        UPDATE public.property_investment_details
        SET 
            tokens_sold = tokens_sold + NEW.tokens_purchased,
            tokens_available = tokens_available - NEW.tokens_purchased,
            amount_raised = amount_raised + NEW.amount,
            updated_at = NOW()
        WHERE property_id = NEW.property_id;
    
    -- Handle refunds or cancellations - IMPORTANT: This won't affect past distributions
    -- because we use snapshots at distribution time
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status != 'completed' THEN
        -- Only adjust available tokens if the tokens aren't already allocated to a distribution
        -- This prevents affecting past distributions
        UPDATE public.property_investment_details
        SET 
            tokens_sold = tokens_sold - OLD.tokens_purchased,
            tokens_available = tokens_available + OLD.tokens_purchased,
            amount_raised = amount_raised - OLD.amount,
            updated_at = NOW()
        WHERE property_id = NEW.property_id
        -- Only allow if no distributions exist after the investment date
        AND NOT EXISTS (
            SELECT 1 
            FROM public.investment_distributions d 
            WHERE d.property_id = NEW.property_id 
            AND d.distribution_date > NEW.created_at
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the investor_earnings view to use snapshot_balance
CREATE OR REPLACE VIEW public.investor_earnings_view AS
SELECT 
    ie.*,
    ie.snapshot_balance as tokens_owned,
    ie.amount_earned as distribution_amount,
    d.distribution_date,
    d.period_start,
    d.period_end,
    p.name as property_name,
    u.email as investor_email
FROM 
    public.investor_earnings ie
JOIN 
    public.investment_distributions d ON ie.distribution_id = d.id
JOIN 
    public.properties p ON d.property_id = p.id
JOIN
    auth.users u ON ie.investor_id = u.id;

-- Add a function to get current token balance for an investor
CREATE OR REPLACE FUNCTION get_investor_token_balance(
    p_investor_id UUID,
    p_property_id UUID
)
RETURNS BIGINT AS $$
DECLARE
    v_balance BIGINT;
BEGIN
    SELECT COALESCE(SUM(tokens_purchased), 0) INTO v_balance
    FROM public.investments
    WHERE investor_id = p_investor_id
    AND property_id = p_property_id
    AND status = 'completed';
    
    RETURN v_balance;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add a function to get token balance at a specific date
CREATE OR REPLACE FUNCTION get_investor_token_balance_at_date(
    p_investor_id UUID,
    p_property_id UUID,
    p_date TIMESTAMP WITH TIME ZONE
)
RETURNS BIGINT AS $$
DECLARE
    v_balance BIGINT;
BEGIN
    SELECT COALESCE(SUM(tokens_purchased), 0) INTO v_balance
    FROM public.investments
    WHERE investor_id = p_investor_id
    AND property_id = p_property_id
    AND status = 'completed'
    AND created_at <= p_date;
    
    RETURN v_balance;
END;
$$ LANGUAGE plpgsql STABLE;
