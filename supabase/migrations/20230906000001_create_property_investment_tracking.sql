-- Create property_investment_details table to track token distribution
CREATE TABLE IF NOT EXISTS public.property_investment_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL UNIQUE REFERENCES public.properties(id) ON DELETE CASCADE,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    tokens_available BIGINT NOT NULL DEFAULT 0,
    tokens_sold BIGINT NOT NULL DEFAULT 0,
    funding_goal NUMERIC(18, 2) NOT NULL,
    amount_raised NUMERIC(18, 2) NOT NULL DEFAULT 0,
    funding_progress NUMERIC(5, 2) GENERATED ALWAYS AS (
      CASE 
        WHEN funding_goal > 0 THEN LEAST(100, ROUND((amount_raised / funding_goal) * 100, 2))
        ELSE 0
      END
    ) STORED,
    min_investment NUMERIC(18, 2) NOT NULL,
    max_investment NUMERIC(18, 2),
    token_price NUMERIC(18, 6) NOT NULL,
    yield_rate NUMERIC(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create investment_distributions table to track payouts
CREATE TABLE IF NOT EXISTS public.investment_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    distribution_date TIMESTAMP WITH TIME ZONE NOT NULL,
    amount_per_token NUMERIC(18, 6) NOT NULL,
    total_amount NUMERIC(18, 2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, period_start, period_end)
);

-- Create investor_earnings table to track individual earnings
CREATE TABLE IF NOT EXISTS public.investor_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
    distribution_id UUID NOT NULL REFERENCES public.investment_distributions(id) ON DELETE CASCADE,
    investor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tokens_owned_at_distribution BIGINT NOT NULL,
    amount_earned NUMERIC(18, 2) NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT false,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a view for property investment overview
CREATE OR REPLACE VIEW public.property_investment_overview AS
SELECT 
    p.id as property_id,
    p.name as property_name,
    p.status,
    pid.total_tokens,
    pid.tokens_available,
    pid.tokens_sold,
    pid.funding_goal,
    pid.amount_raised,
    pid.funding_progress,
    pid.token_price,
    pid.yield_rate,
    COUNT(DISTINCT i.investor_id) as total_investors,
    COUNT(i.id) as total_investments,
    MAX(i.created_at) as last_investment_date,
    p.created_at as property_created_at,
    p.updated_at as property_updated_at
FROM 
    public.properties p
LEFT JOIN 
    public.property_investment_details pid ON p.id = pid.property_id
LEFT JOIN 
    public.investments i ON p.id = i.property_id AND i.status = 'completed'
GROUP BY 
    p.id, pid.id;

-- Create a view for investor portfolio
CREATE OR REPLACE VIEW public.investor_portfolio AS
SELECT 
    i.investor_id,
    u.email as investor_email,
    p.id as property_id,
    p.name as property_name,
    p.status as property_status,
    SUM(i.tokens_purchased) as total_tokens,
    SUM(i.amount) as total_invested,
    AVG(i.token_price) as average_token_price,
    COUNT(i.id) as number_of_investments,
    MAX(i.created_at) as last_investment_date,
    COALESCE(SUM(ie.amount_earned), 0) as total_earnings
FROM 
    public.investments i
JOIN 
    public.properties p ON i.property_id = p.id
JOIN
    auth.users u ON i.investor_id = u.id
LEFT JOIN
    public.investor_earnings ie ON i.id = ie.investment_id
WHERE 
    i.status = 'completed'
GROUP BY 
    i.investor_id, u.email, p.id, p.name, p.status;

-- Create a view for investment performance
CREATE OR REPLACE VIEW public.investment_performance AS
SELECT 
    i.id as investment_id,
    i.property_id,
    p.name as property_name,
    i.investor_id,
    u.email as investor_email,
    i.amount as invested_amount,
    i.tokens_purchased,
    i.token_price,
    i.created_at as investment_date,
    COUNT(ie.id) as distributions_received,
    COALESCE(SUM(ie.amount_earned), 0) as total_earnings,
    (COALESCE(SUM(ie.amount_earned), 0) / NULLIF(i.amount, 0)) * 100 as roi_percentage,
    p.status as property_status
FROM 
    public.investments i
JOIN 
    public.properties p ON i.property_id = p.id
JOIN
    auth.users u ON i.investor_id = u.id
LEFT JOIN
    public.investor_earnings ie ON i.id = ie.investment_id AND ie.paid = true
WHERE 
    i.status = 'completed'
GROUP BY 
    i.id, p.id, p.name, p.status, u.email;

-- Create triggers for automatic updates
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
    
    -- Handle refunds or cancellations
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status != 'completed' THEN
        UPDATE public.property_investment_details
        SET 
            tokens_sold = tokens_sold - OLD.tokens_purchased,
            tokens_available = tokens_available + OLD.tokens_purchased,
            amount_raised = amount_raised - OLD.amount,
            updated_at = NOW()
        WHERE property_id = NEW.property_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for investment status changes
CREATE TRIGGER update_investment_status_trigger
AFTER INSERT OR UPDATE OF status ON public.investments
FOR EACH ROW
EXECUTE FUNCTION update_property_investment_details();

-- Create function to initialize property investment details
CREATE OR REPLACE FUNCTION initialize_property_investment_details()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.property_investment_details (
        property_id,
        total_tokens,
        tokens_available,
        funding_goal,
        min_investment,
        max_investment,
        token_price,
        yield_rate
    ) VALUES (
        NEW.id,
        FLOOR(NEW.total_value / NEW.token_price),
        FLOOR(NEW.total_value / NEW.token_price),
        NEW.total_value,
        NEW.min_investment,
        NEW.max_investment,
        NEW.token_price,
        NULLIF(SPLIT_PART(NEW.yield_rate, '%', 1), '')::NUMERIC
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize investment details when a new property is created
CREATE TRIGGER initialize_property_investment_trigger
AFTER INSERT ON public.properties
FOR EACH ROW
WHEN (NEW.token_price IS NOT NULL AND NEW.token_price > 0)
EXECUTE FUNCTION initialize_property_investment_details();

-- Enable RLS on new tables
ALTER TABLE public.property_investment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_earnings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for property_investment_details
CREATE POLICY "Enable read access for all users"
ON public.property_investment_details
FOR SELECT
USING (true);

-- Create RLS policies for investment_distributions
CREATE POLICY "Enable read access for all users"
ON public.investment_distributions
FOR SELECT
USING (true);

-- Create RLS policies for investor_earnings
CREATE POLICY "Enable read access for owner"
ON public.investor_earnings
FOR SELECT
USING (investor_id = auth.uid());

-- Create a view for investment summaries
CREATE OR REPLACE VIEW public.investment_summaries AS
SELECT 
    i.property_id,
    p.name as property_name,
    p.status as property_status,
    pid.total_tokens,
    pid.tokens_available as tokens_available,
    pid.tokens_sold as tokens_sold,
    pid.funding_goal,
    pid.amount_raised,
    pid.funding_progress,
    pid.token_price,
    pid.yield_rate,
    COUNT(DISTINCT i.investor_id) as total_investors,
    COUNT(i.id) as total_investments,
    MAX(i.created_at) as last_investment_date,
    p.created_at as property_created_at,
    p.updated_at as property_updated_at
FROM 
    public.investments i
JOIN 
    public.properties p ON i.property_id = p.id
LEFT JOIN
    public.property_investment_details pid ON p.id = pid.property_id
WHERE 
    i.status = 'completed'
GROUP BY 
    i.property_id, p.id, p.name, p.status, p.created_at, p.updated_at, 
    pid.id, pid.total_tokens, pid.tokens_available, pid.tokens_sold, 
    pid.funding_goal, pid.amount_raised, pid.funding_progress, 
    pid.token_price, pid.yield_rate;
