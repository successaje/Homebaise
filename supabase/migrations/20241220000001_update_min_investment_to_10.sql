-- Update minimum investment to $10 for all properties
-- This migration updates existing properties to have a minimum investment of $10

UPDATE properties 
SET min_investment = 10.00 
WHERE min_investment > 10.00;

-- Also update any property_investment_details records if they exist
UPDATE property_investment_details 
SET min_investment = 10.00 
WHERE min_investment > 10.00;

-- Add a comment to document this change
COMMENT ON COLUMN properties.min_investment IS 'Minimum investment amount in USD. Global minimum is $10.';
