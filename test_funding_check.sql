-- Test query to check funding progress calculation
SELECT 
  p.id,
  p.name,
  p.total_value,
  p.funded_amount_usd,
  p.funded_percent,
  COALESCE(SUM(CASE WHEN i.status = 'completed' THEN i.amount ELSE 0 END), 0) as actual_funded_amount,
  CASE 
    WHEN p.total_value > 0 
    THEN ROUND((COALESCE(SUM(CASE WHEN i.status = 'completed' THEN i.amount ELSE 0 END), 0) / p.total_value) * 100, 2)
    ELSE 0 
  END as calculated_funded_percent
FROM properties p
LEFT JOIN investments i ON p.id = i.property_id
GROUP BY p.id, p.name, p.total_value, p.funded_amount_usd, p.funded_percent
LIMIT 5;
