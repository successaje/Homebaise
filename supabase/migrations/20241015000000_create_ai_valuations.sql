-- Create AI Valuations table
CREATE TABLE IF NOT EXISTS public.ai_valuations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    analysis_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_valuations_property_id ON public.ai_valuations(property_id);
CREATE INDEX IF NOT EXISTS idx_ai_valuations_created_at ON public.ai_valuations(created_at DESC);

-- Create RLS policies
ALTER TABLE public.ai_valuations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read AI valuations
CREATE POLICY "Allow authenticated users to read AI valuations" ON public.ai_valuations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert AI valuations
CREATE POLICY "Allow authenticated users to insert AI valuations" ON public.ai_valuations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update AI valuations
CREATE POLICY "Allow authenticated users to update AI valuations" ON public.ai_valuations
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create a view for AI valuation summaries
CREATE OR REPLACE VIEW public.ai_valuation_summaries AS
SELECT 
    av.id,
    av.property_id,
    p.name as property_name,
    p.location,
    p.property_type,
    p.total_value as listed_value,
    (av.analysis_data->>'valuation'->>'estimated_value')::numeric as ai_estimated_value,
    (av.analysis_data->>'valuation'->>'confidence_score')::numeric as confidence_score,
    (av.analysis_data->>'risk_score'->>'overall_risk')::numeric as overall_risk,
    (av.analysis_data->>'market_analysis'->>'growth_potential')::numeric as growth_potential,
    av.analysis_data->>'market_analysis'->>'investment_recommendation' as recommendation,
    av.created_at,
    av.updated_at
FROM public.ai_valuations av
JOIN public.properties p ON av.property_id = p.id
ORDER BY av.created_at DESC;

-- Create a function to get the latest AI valuation for a property
CREATE OR REPLACE FUNCTION public.get_latest_ai_valuation(property_uuid UUID)
RETURNS TABLE (
    id UUID,
    property_id UUID,
    analysis_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        av.id,
        av.property_id,
        av.analysis_data,
        av.created_at,
        av.updated_at
    FROM public.ai_valuations av
    WHERE av.property_id = property_uuid
    ORDER BY av.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get AI valuation statistics
CREATE OR REPLACE FUNCTION public.get_ai_valuation_stats()
RETURNS TABLE (
    total_valuations BIGINT,
    avg_confidence_score NUMERIC,
    avg_risk_score NUMERIC,
    avg_growth_potential NUMERIC,
    most_common_recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_valuations,
        AVG((analysis_data->>'valuation'->>'confidence_score')::numeric) as avg_confidence_score,
        AVG((analysis_data->>'risk_score'->>'overall_risk')::numeric) as avg_risk_score,
        AVG((analysis_data->>'market_analysis'->>'growth_potential')::numeric) as avg_growth_potential,
        MODE() WITHIN GROUP (ORDER BY analysis_data->>'market_analysis'->>'investment_recommendation') as most_common_recommendation
    FROM public.ai_valuations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_ai_valuations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_valuations_updated_at
    BEFORE UPDATE ON public.ai_valuations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ai_valuations_updated_at();

-- Add AI valuation fields to properties table for quick access
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS ai_valuation_id UUID REFERENCES public.ai_valuations(id),
ADD COLUMN IF NOT EXISTS ai_estimated_value NUMERIC,
ADD COLUMN IF NOT EXISTS ai_confidence_score NUMERIC,
ADD COLUMN IF NOT EXISTS ai_risk_score NUMERIC,
ADD COLUMN IF NOT EXISTS ai_growth_potential NUMERIC,
ADD COLUMN IF NOT EXISTS ai_recommendation TEXT,
ADD COLUMN IF NOT EXISTS ai_last_updated TIMESTAMP WITH TIME ZONE;

-- Create index on new AI fields
CREATE INDEX IF NOT EXISTS idx_properties_ai_valuation_id ON public.properties(ai_valuation_id);
CREATE INDEX IF NOT EXISTS idx_properties_ai_estimated_value ON public.properties(ai_estimated_value);
CREATE INDEX IF NOT EXISTS idx_properties_ai_risk_score ON public.properties(ai_risk_score);

-- Create a function to update property AI fields when valuation is created/updated
CREATE OR REPLACE FUNCTION public.update_property_ai_fields()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.properties 
    SET 
        ai_valuation_id = NEW.id,
        ai_estimated_value = (NEW.analysis_data->>'valuation'->>'estimated_value')::numeric,
        ai_confidence_score = (NEW.analysis_data->>'valuation'->>'confidence_score')::numeric,
        ai_risk_score = (NEW.analysis_data->>'risk_score'->>'overall_risk')::numeric,
        ai_growth_potential = (NEW.analysis_data->>'market_analysis'->>'growth_potential')::numeric,
        ai_recommendation = NEW.analysis_data->>'market_analysis'->>'investment_recommendation',
        ai_last_updated = NEW.updated_at
    WHERE id = NEW.property_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_property_ai_fields
    AFTER INSERT OR UPDATE ON public.ai_valuations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_property_ai_fields();

-- Create a view for properties with AI insights
CREATE OR REPLACE VIEW public.properties_with_ai_insights AS
SELECT 
    p.*,
    av.analysis_data,
    av.created_at as ai_analysis_date,
    av.updated_at as ai_last_updated,
    CASE 
        WHEN p.ai_estimated_value > p.total_value * 1.1 THEN 'Undervalued'
        WHEN p.ai_estimated_value < p.total_value * 0.9 THEN 'Overvalued'
        ELSE 'Fair Value'
    END as valuation_status,
    CASE 
        WHEN p.ai_risk_score <= 3 THEN 'Low Risk'
        WHEN p.ai_risk_score <= 6 THEN 'Medium Risk'
        ELSE 'High Risk'
    END as risk_category,
    CASE 
        WHEN p.ai_growth_potential >= 8 THEN 'High Growth'
        WHEN p.ai_growth_potential >= 6 THEN 'Medium Growth'
        ELSE 'Low Growth'
    END as growth_category
FROM public.properties p
LEFT JOIN public.ai_valuations av ON p.ai_valuation_id = av.id
ORDER BY p.created_at DESC;

-- Grant permissions
GRANT SELECT ON public.ai_valuations TO authenticated;
GRANT INSERT ON public.ai_valuations TO authenticated;
GRANT UPDATE ON public.ai_valuations TO authenticated;
GRANT SELECT ON public.ai_valuation_summaries TO authenticated;
GRANT SELECT ON public.properties_with_ai_insights TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_latest_ai_valuation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_valuation_stats() TO authenticated;

