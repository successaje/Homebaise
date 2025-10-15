# Marketplace Troubleshooting Guide

## ✅ Issues Fixed

### Issue 1: "Missing required fields" Error ✅ FIXED

**Error:**
```
400 (Bad Request)
Error: Missing required fields
```

**Root Cause:**
- The `token_id` field was missing or `null` in the property object
- Properties need to have their Hedera token ID to be tradeable

**Solution Applied:**
1. Updated `TradeForm.tsx` to fetch `token_id` from `property_treasury_accounts` table if not in property
2. Updated marketplace pages to join with treasury accounts table
3. Added better error messages showing which specific fields are missing

**Files Modified:**
- ✅ `src/components/marketplace/TradeForm.tsx`
- ✅ `src/app/marketplace/page.tsx`
- ✅ `src/app/marketplace/[propertyId]/page.tsx`
- ✅ `src/app/api/marketplace/orders/route.ts`

---

### Issue 2: Column "token_symbol" Does Not Exist ✅ FIXED

**Error:**
```
ERROR: 42703: column p.token_symbol does not exist
```

**Root Cause:**
- Migration tried to use `p.token_symbol` which doesn't exist in properties table

**Solution Applied:**
- Removed `p.token_symbol` from the `marketplace_recent_trades` view

**File Modified:**
- ✅ `supabase/migrations/20241009000000_create_marketplace.sql`

---

## 🔍 How to Test

### 1. Check if Property is Tokenized

```sql
-- Check if property has token_id in treasury
SELECT 
  p.id,
  p.name,
  p.status,
  t.token_id,
  t.hedera_account_id
FROM properties p
LEFT JOIN property_treasury_accounts t ON p.id = t.property_id
WHERE p.id = 'your-property-uuid';
```

**Expected Result:**
- `status` should be `'tokenized'`
- `token_id` should NOT be NULL
- Should look like: `'0.0.123456'`

---

### 2. Test Order Creation

```bash
# 1. Navigate to marketplace
http://localhost:3000/marketplace

# 2. Click on a tokenized property

# 3. Open browser console (F12)

# 4. Try to place an order

# 5. Check console logs:
# Should see: "Creating order with data: {property_id, token_id, ...}"
```

**If token_id is null:**
- Check if property is in `property_treasury_accounts` table
- Verify property was tokenized properly

---

## 🛠️ Manual Fixes

### If Property Still Missing token_id

**Option 1: Fetch from Treasury (Automatic)**
The code now automatically fetches `token_id` from `property_treasury_accounts` table.

**Option 2: Add to Properties Table (Optional)**
```sql
-- Update properties table with token_id from treasury
UPDATE properties p
SET token_id = t.token_id
FROM property_treasury_accounts t
WHERE p.id = t.property_id
  AND p.token_id IS NULL;
```

---

### If Property Not Tokenized Yet

You need to tokenize the property first:

```typescript
// Use the tokenization API or admin panel
POST /api/tokenize-property
{
  "property_id": "your-uuid",
  "token_name": "Property Token",
  "token_symbol": "PROP",
  "total_supply": 10000
}
```

---

## 📋 Pre-Trading Checklist

Before a property can be traded, ensure:

- [ ] **Property Status**: Must be `'tokenized'`
- [ ] **Treasury Account**: Must exist in `property_treasury_accounts` table
- [ ] **Token ID**: Must not be NULL (format: `'0.0.123456'`)
- [ ] **Token Balance**: Treasury must have tokens available
- [ ] **User Account**: User must have Hedera account set up
- [ ] **User KYC**: User must be KYC verified

### Check Query:
```sql
SELECT 
  p.id,
  p.name,
  p.status,
  t.token_id,
  t.token_balance,
  t.hedera_account_id
FROM properties p
LEFT JOIN property_treasury_accounts t ON p.id = t.property_id
WHERE p.status = 'tokenized';
```

---

## 🐛 Debug Mode

### Enable Debug Logging

The code now has debug logs. Check browser console:

```javascript
// In TradeForm, you'll see:
Creating order with data: {
  property_id: "...",
  token_id: "0.0.123456",  // ← Should NOT be null
  order_type: "buy",
  token_amount: 100,
  price_per_token: 50,
  currency: "HBAR"
}
```

### API Error Logging

If order fails, the API will tell you exactly which fields are missing:

```json
{
  "error": "Missing required fields: token_id, price_per_token"
}
```

---

## 🔧 Common Issues & Solutions

### Issue: "This property has not been tokenized yet"

**Cause:** No token_id found in property or treasury table

**Solution:**
1. Check if property exists in `property_treasury_accounts`
2. If not, tokenize the property first
3. If yes, check if `token_id` field is populated

```sql
SELECT * FROM property_treasury_accounts 
WHERE property_id = 'your-uuid';
```

---

### Issue: Order Creates but Doesn't Match

**Cause:** Order matching happens asynchronously

**Solution:**
- Wait a few seconds
- Refresh the page
- Check "My Orders" section
- Look for opposite side orders in order book

---

### Issue: "Insufficient token balance"

**Cause:** User trying to sell more tokens than they own

**Solution:**
1. Check user's actual holdings:
```sql
SELECT SUM(tokens_purchased) 
FROM investments 
WHERE investor_id = 'user-uuid' 
  AND property_id = 'property-uuid'
  AND status = 'completed';
```

2. Check open sell orders:
```sql
SELECT SUM(remaining_amount)
FROM marketplace_orders
WHERE seller_id = 'user-uuid'
  AND property_id = 'property-uuid'
  AND status IN ('open', 'partially_filled');
```

3. Available balance = holdings - open orders

---

## 🎯 Quick Fixes

### Fix 1: Populate Missing token_id

```sql
-- Copy token_id from treasury to properties
UPDATE properties p
SET token_id = t.token_id
FROM property_treasury_accounts t
WHERE p.id = t.property_id
  AND p.token_id IS NULL
  AND t.token_id IS NOT NULL;
```

### Fix 2: Reset Failed Orders

```sql
-- Cancel stuck orders
UPDATE marketplace_orders
SET status = 'cancelled',
    cancelled_at = NOW()
WHERE status = 'open'
  AND created_at < NOW() - INTERVAL '1 day';
```

### Fix 3: Refresh Statistics

```sql
-- Recalculate marketplace statistics
DELETE FROM marketplace_statistics;
-- Stats will be recreated automatically on next request
```

---

## 📊 Monitoring Queries

### Check Active Orders
```sql
SELECT 
  p.name,
  o.order_type,
  o.token_amount,
  o.price_per_token,
  o.status,
  o.created_at
FROM marketplace_orders o
JOIN properties p ON o.property_id = p.id
WHERE o.status IN ('open', 'partially_filled')
ORDER BY o.created_at DESC
LIMIT 20;
```

### Check Recent Trades
```sql
SELECT 
  p.name,
  t.token_amount,
  t.price_per_token,
  t.total_price,
  t.status,
  t.completed_at
FROM marketplace_trades t
JOIN properties p ON t.property_id = p.id
WHERE t.status = 'completed'
ORDER BY t.completed_at DESC
LIMIT 20;
```

### Check Properties Ready for Trading
```sql
SELECT 
  p.id,
  p.name,
  p.status,
  t.token_id,
  t.token_balance,
  CASE 
    WHEN p.status = 'tokenized' AND t.token_id IS NOT NULL THEN '✅ Ready'
    WHEN p.status = 'tokenized' AND t.token_id IS NULL THEN '❌ Missing token_id'
    ELSE '⏳ Not tokenized'
  END as trading_status
FROM properties p
LEFT JOIN property_treasury_accounts t ON p.id = t.property_id
ORDER BY p.created_at DESC;
```

---

## 🚀 After Fixes Applied

### What Should Work Now:

1. ✅ **Order Creation**: All required fields properly populated
2. ✅ **Error Messages**: Clear indication of what's missing
3. ✅ **Token ID Fetching**: Automatically fetched from treasury if needed
4. ✅ **Marketplace Listing**: Only shows properly tokenized properties
5. ✅ **Trading Interface**: Shows properties with valid token_id

### Test Flow:

```
1. Visit /marketplace
   ✅ Should see tokenized properties

2. Click a property
   ✅ Should load trading interface

3. Try to place an order
   ✅ Should either:
      - Create order successfully, OR
      - Show clear error message

4. Check console logs
   ✅ Should see: "Creating order with data: {...}"
   ✅ token_id should NOT be null

5. If error occurs
   ✅ Error message shows which field is missing
```

---

## 📝 Still Having Issues?

### Check These:

1. **Migration Applied?**
   ```sql
   SELECT * FROM marketplace_orders LIMIT 1;
   ```
   Should return without error

2. **Supabase Connection?**
   Check browser console for connection errors

3. **Authentication?**
   User must be signed in

4. **Property Status?**
   ```sql
   SELECT status FROM properties WHERE id = 'your-uuid';
   ```
   Should be `'tokenized'`

5. **Token ID Format?**
   Should look like: `'0.0.123456'`
   NOT: `null`, `undefined`, `''`

---

## 🎉 Success Indicators

You'll know everything is working when:

- ✅ No "Missing required fields" errors
- ✅ Console log shows complete order data
- ✅ Order appears in "My Orders" section
- ✅ Order book updates in real-time
- ✅ If match found, trade executes automatically

---

## 📞 Need More Help?

1. Check browser console for errors
2. Check server logs for API errors
3. Run the monitoring queries above
4. Verify property tokenization status
5. Check this troubleshooting guide again

---

**All issues should now be resolved!** 🎯

If you encounter any new errors, check:
1. Browser console
2. Network tab (for API responses)
3. Database queries above
4. This guide for similar issues

