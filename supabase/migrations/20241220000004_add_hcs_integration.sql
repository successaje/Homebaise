-- Add HCS (Hedera Consensus Service) integration
-- This enables transparent event logging for all property transactions

-- Add topic_id column to property_treasury_accounts table
ALTER TABLE public.property_treasury_accounts
ADD COLUMN IF NOT EXISTS topic_id TEXT;

-- Add comment to document the purpose
COMMENT ON COLUMN public.property_treasury_accounts.topic_id IS 'HCS topic ID for transparent event logging of property transactions';

-- Create property_events table to mirror HCS messages
CREATE TABLE IF NOT EXISTS public.property_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id TEXT NOT NULL,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    investor TEXT,
    amount DECIMAL(15,2),
    tx_id TEXT NOT NULL,
    hcs_tx_id TEXT, -- HCS transaction ID
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_events_property_id ON public.property_events(property_id);
CREATE INDEX IF NOT EXISTS idx_property_events_topic_id ON public.property_events(topic_id);
CREATE INDEX IF NOT EXISTS idx_property_events_event_type ON public.property_events(event_type);
CREATE INDEX IF NOT EXISTS idx_property_events_timestamp ON public.property_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_property_events_investor ON public.property_events(investor);

-- Add comment to document the table purpose
COMMENT ON TABLE public.property_events IS 'Mirrors HCS messages for property events - provides fast querying and backup of blockchain events';

-- Add RLS policies for property_events
ALTER TABLE public.property_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view events for properties they have access to
CREATE POLICY "Users can view property events" ON public.property_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.properties 
            WHERE properties.id = property_events.property_id 
            AND (
                properties.listed_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.investments 
                    WHERE investments.property_id = properties.id 
                    AND investments.investor_id = auth.uid()
                )
            )
        )
    );

-- Policy: System can insert events (for HCS mirroring)
CREATE POLICY "System can insert property events" ON public.property_events
    FOR INSERT WITH CHECK (true);

-- Policy: System can update events (for HCS transaction ID updates)
CREATE POLICY "System can update property events" ON public.property_events
    FOR UPDATE USING (true);

-- Grant necessary permissions
GRANT SELECT ON public.property_events TO authenticated;
GRANT SELECT ON public.property_events TO anon;
GRANT INSERT, UPDATE ON public.property_events TO authenticated;

-- Create function to log property events
CREATE OR REPLACE FUNCTION log_property_event(
    p_topic_id TEXT,
    p_property_id UUID,
    p_event_type TEXT,
    p_investor TEXT DEFAULT NULL,
    p_amount DECIMAL(15,2) DEFAULT NULL,
    p_tx_id TEXT DEFAULT NULL,
    p_hcs_tx_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO public.property_events (
        topic_id,
        property_id,
        event_type,
        investor,
        amount,
        tx_id,
        hcs_tx_id,
        metadata
    ) VALUES (
        p_topic_id,
        p_property_id,
        p_event_type,
        p_investor,
        p_amount,
        p_tx_id,
        p_hcs_tx_id,
        p_metadata
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION log_property_event TO authenticated;

-- Add comment to document the function
COMMENT ON FUNCTION log_property_event IS 'Logs property events to the database, mirroring HCS messages for fast querying';
