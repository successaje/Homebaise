# Secondary Marketplace - Installation Guide

## 📦 Required Dependencies

### Install Charting Library

```bash
npm install recharts
```

**Or with yarn:**
```bash
yarn add recharts
```

**Or with pnpm:**
```bash
pnpm add recharts
```

### Verify Installation

```bash
# Check package.json
cat package.json | grep recharts
# Should show: "recharts": "^2.x.x"
```

---

## 🗄️ Database Setup

### Apply Migration

**Option 1: Supabase CLI (Recommended)**
```bash
supabase db push
```

**Option 2: Direct SQL**
```bash
psql postgresql://user:pass@host:port/database \
  -f supabase/migrations/20241009000000_create_marketplace.sql
```

**Option 3: Supabase Dashboard**
1. Go to SQL Editor in Supabase Dashboard
2. Copy content from migration file
3. Click "Run"

### Verify Migration

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'marketplace_%';

-- Expected output:
-- marketplace_orders
-- marketplace_trades
-- marketplace_price_history
-- marketplace_statistics
-- user_trading_stats
```

---

## 🎨 Component Architecture

```
┌─────────────────────────────────────────────────┐
│           /marketplace (Listing Page)           │
│  - Browse all tradeable properties              │
│  - Filter by hot/new                            │
│  - Market overview stats                        │
└────────────┬────────────────────────────────────┘
             │
             │ Click property
             ▼
┌─────────────────────────────────────────────────┐
│     /marketplace/[id] (Trading Page)            │
├─────────────────────────────────────────────────┤
│  ┌───────────────────┐  ┌──────────────────┐   │
│  │   MarketStats     │  │   TradeForm      │   │
│  │  (price, volume)  │  │  (buy/sell)      │   │
│  └───────────────────┘  └──────────────────┘   │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐   │
│  │         TradingChart                    │   │
│  │  (candlestick/line/area + volume)       │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  ┌───────────────────┐  ┌──────────────────┐   │
│  │  RecentTrades     │  │   OrderBook      │   │
│  │  (trade feed)     │  │  (bids/asks)     │   │
│  └───────────────────┘  └──────────────────┘   │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐   │
│  │           MyOrders                      │   │
│  │  (user's open orders)                   │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Creating an Order

```
User Action
    │
    ├─ 1. Click "Buy" or "Sell"
    │
    ├─ 2. Enter amount & price
    │
    ├─ 3. Click "Buy/Sell Tokens"
    │
    ▼
TradeForm Component
    │
    ├─ 4. Validate form
    │
    ├─ 5. POST /api/marketplace/orders
    │
    ▼
API Endpoint
    │
    ├─ 6. Authenticate user
    │
    ├─ 7. Validate balance (if sell)
    │
    ├─ 8. Create order in database
    │
    ▼
MarketplaceTradingService
    │
    ├─ 9. tryMatchOrders()
    │
    ├─ 10. Find opposite orders
    │
    ├─ 11. Check price compatibility
    │
    ▼
Match Found?
    │
    ├─ YES → executeTrade()
    │     │
    │     ├─ 12. Associate token (if needed)
    │     │
    │     ├─ 13. Transfer tokens (Hedera)
    │     │
    │     ├─ 14. Transfer payment (Hedera)
    │     │
    │     ├─ 15. Record trade
    │     │
    │     └─ 16. Update orders
    │
    └─ NO → Order stays in book
           │
           └─ Wait for future match
```

### Real-time Updates

```
Database Change
    │
    ├─ Trigger: insert/update on orders
    │
    ▼
Postgres Notify
    │
    ├─ Supabase Realtime
    │
    ▼
WebSocket Broadcast
    │
    ├─ Connected clients
    │
    ▼
Component Updates
    │
    ├─ OrderBook refreshes
    ├─ Recent Trades updates
    ├─ My Orders updates
    └─ Statistics recalculate
```

---

## 🔌 API Integration

### Authentication Flow

```typescript
// 1. Get session token
const { data: { session } } = await supabase.auth.getSession();

// 2. Include in API calls
fetch('/api/marketplace/orders', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
});
```

### Creating an Order

```typescript
const response = await fetch('/api/marketplace/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    property_id: 'uuid',
    token_id: '0.0.123456',
    order_type: 'buy',
    token_amount: 100,
    price_per_token: 50.00,
    currency: 'HBAR'
  })
});

const { order } = await response.json();
```

### Fetching Order Book

```typescript
const response = await fetch(
  `/api/marketplace/orderbook?property_id=${propertyId}`
);

const { orderBook, marketDepth } = await response.json();

console.log('Best Bid:', orderBook.bids[0]?.price_per_token);
console.log('Best Ask:', orderBook.asks[0]?.price_per_token);
console.log('Spread:', orderBook.spread);
```

---

## 🧪 Testing Strategy

### Unit Tests (To Add)

```typescript
// tests/marketplace-trading.test.ts
describe('MarketplaceTradingService', () => {
  test('creates valid order', async () => {
    const result = await MarketplaceTradingService.createOrder(userId, {
      property_id: 'test-uuid',
      token_id: '0.0.123456',
      order_type: 'buy',
      token_amount: 100,
      price_per_token: 50.00
    });
    
    expect(result.success).toBe(true);
    expect(result.order).toBeDefined();
  });
  
  test('matches compatible orders', async () => {
    // Create sell order
    await createOrder({ type: 'sell', price: 50, amount: 100 });
    
    // Create matching buy order
    const result = await createOrder({ type: 'buy', price: 51, amount: 100 });
    
    // Should execute trade
    expect(result.order.status).toBe('filled');
  });
});
```

### Integration Tests

```typescript
// tests/marketplace-integration.test.ts
describe('Full Trading Flow', () => {
  test('complete buy/sell cycle', async () => {
    // 1. User A sells 100 tokens
    const sellOrder = await placeSellOrder(userA, 100, 50);
    
    // 2. User B buys 100 tokens
    const buyOrder = await placeBuyOrder(userB, 100, 50);
    
    // 3. Verify trade executed
    const trades = await getTradesForProperty(propertyId);
    expect(trades).toHaveLength(1);
    
    // 4. Verify balances updated
    const balanceA = await getBalance(userA);
    const balanceB = await getBalance(userB);
    expect(balanceA).toBe(0);
    expect(balanceB).toBe(100);
  });
});
```

### E2E Tests (Cypress/Playwright)

```typescript
// e2e/marketplace.spec.ts
test('user can trade tokens', async ({ page }) => {
  // 1. Navigate to marketplace
  await page.goto('/marketplace');
  
  // 2. Click property
  await page.click('[data-testid="property-card"]');
  
  // 3. Place buy order
  await page.fill('[data-testid="amount"]', '100');
  await page.fill('[data-testid="price"]', '50');
  await page.click('[data-testid="buy-button"]');
  
  // 4. Verify success
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Insufficient token balance"

**Cause:** User trying to sell more tokens than they own.

**Solution:**
```typescript
// Check actual holdings
const { data: investments } = await supabase
  .from('investments')
  .select('tokens_purchased')
  .eq('investor_id', userId)
  .eq('property_id', propertyId)
  .eq('status', 'completed');

const totalOwned = investments.reduce((sum, inv) => 
  sum + inv.tokens_purchased, 0
);

console.log('User owns:', totalOwned, 'tokens');
```

### Issue 2: "Token transfer failed"

**Cause:** Token not associated with buyer account.

**Solution:** Already handled in code! Token association happens automatically.

```typescript
// In executeTrade()
await ensureTokenAssociation({
  client,
  userAccountId: buyerProfile.hedera_account_id,
  userPrivateKey: buyerProfile.hedera_private_key,
  tokenId: input.token_id
});
```

### Issue 3: Chart shows no data

**Cause:** No completed trades yet for the property.

**Solution:** Complete at least one trade to populate price history.

```sql
-- Check if trades exist
SELECT COUNT(*) FROM marketplace_trades
WHERE property_id = 'your-uuid'
  AND status = 'completed';
```

### Issue 4: Real-time updates not working

**Cause:** WebSocket connection failed or RLS policy blocking.

**Solution:**
1. Check browser console for errors
2. Verify RLS policies allow SELECT on tables
3. Test WebSocket connection:

```typescript
const test = supabase
  .channel('test')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'marketplace_orders'
  }, (payload) => {
    console.log('Received update:', payload);
  })
  .subscribe((status) => {
    console.log('Subscription status:', status);
  });
```

---

## 📊 Monitoring & Observability

### Key Metrics to Track

```sql
-- Active orders
SELECT COUNT(*) as active_orders
FROM marketplace_orders
WHERE status IN ('open', 'partially_filled');

-- Daily trading volume
SELECT 
  DATE(completed_at) as date,
  SUM(token_amount) as volume,
  COUNT(*) as trades
FROM marketplace_trades
WHERE status = 'completed'
  AND completed_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(completed_at);

-- Top traded properties
SELECT 
  p.name,
  COUNT(t.id) as trades,
  SUM(t.token_amount) as volume
FROM marketplace_trades t
JOIN properties p ON t.property_id = p.id
WHERE t.status = 'completed'
  AND t.completed_at > NOW() - INTERVAL '7 days'
GROUP BY p.name
ORDER BY volume DESC
LIMIT 10;
```

### Performance Monitoring

```typescript
// Add to API routes
import { performance } from 'perf_hooks';

const start = performance.now();
// ... handle request
const duration = performance.now() - start;

console.log(`Request took ${duration}ms`);

// Alert if slow
if (duration > 1000) {
  console.warn('Slow request detected!');
}
```

---

## 🚀 Deployment Checklist

### Pre-deployment

- [ ] All dependencies installed
- [ ] Database migration applied
- [ ] Environment variables set
- [ ] Test trades executed successfully
- [ ] No linter errors
- [ ] Documentation reviewed

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Hedera (use mainnet for production!)
MY_ACCOUNT_ID=0.0.xxxxx
MY_PRIVATE_KEY=302e...
NEXT_PUBLIC_HEDERA_NETWORK=mainnet
```

### Production Considerations

1. **Switch to Hedera Mainnet**
   ```typescript
   // In marketplace-trading.ts
   this.client = Client.forMainnet() // Change from forTestnet()
     .setOperator(operatorId, operatorKey);
   ```

2. **Enable Rate Limiting**
   ```typescript
   // Add to API routes
   import rateLimit from 'express-rate-limit';
   
   const limiter = rateLimit({
     windowMs: 60 * 1000, // 1 minute
     max: 100 // 100 requests per minute
   });
   ```

3. **Add Monitoring**
   - Sentry for error tracking
   - LogRocket for session replay
   - Datadog for infrastructure monitoring

4. **Configure CDN**
   - CloudFlare for static assets
   - Image optimization
   - Caching strategy

---

## 🎉 You're Ready!

Everything is set up. Now you can:

1. **Start the dev server**
   ```bash
   npm run dev
   ```

2. **Navigate to marketplace**
   ```
   http://localhost:3000/marketplace
   ```

3. **Place your first trade!** 🚀

---

## 📞 Support

- **Documentation:** See `SECONDARY_MARKETPLACE_DOCUMENTATION.md`
- **Quick Start:** See `MARKETPLACE_QUICKSTART.md`
- **Summary:** See `MARKETPLACE_FEATURE_SUMMARY.md`

---

**Happy Trading! 📈**

