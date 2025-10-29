-- Create function for atomic funding progress update
-- This prevents race conditions when multiple investments complete simultaneously

CREATE OR REPLACE FUNCTION update_property_funding_atomic(
  p_property_id UUID,
  p_investment_amount NUMERIC(18, 2)
)
RETURNS void AS $$
DECLARE
  v_total_value NUMERIC(18, 2);
  v_new_funded_amount NUMERIC(18, 2);
  v_funded_percent NUMERIC(5, 2);
BEGIN
  -- Get total_value with row lock to prevent race conditions
  SELECT total_value INTO v_total_value
  FROM properties
  WHERE id = p_property_id
  FOR UPDATE;
  
  -- Calculate new funded amount atomically
  UPDATE properties
  SET 
    funded_amount_usd = COALESCE(funded_amount_usd, 0) + p_investment_amount,
    funded_percent = LEAST(
      100.0,
      ROUND(
        ((COALESCE(funded_amount_usd, 0) + p_investment_amount) / NULLIF(total_value, 0)) * 100,
        2
      )
    ),
    updated_at = NOW()
  WHERE id = p_property_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update property funding: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_property_funding_atomic(UUID, NUMERIC) TO authenticated;

COMMENT ON FUNCTION update_property_funding_atomic IS 'Atomically updates property funding progress to prevent race conditions';

