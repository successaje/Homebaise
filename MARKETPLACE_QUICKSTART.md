# Secondary Marketplace - Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install recharts
# or
yarn add recharts
```

**Why Recharts?**
- Lightweight charting library
- Built on React & D3
- Supports candlestick, line, area charts
- Responsive and performant

---

### 2. Run Database Migration

```bash
# Apply the marketplace migration
psql -d your_database -f supabase/migrations/20241009000000_create_marketplace.sql

# Or via Supabase CLI
supabase db push
```

**What it creates:**
- ✅ 5 tables (orders, trades, price_history, statistics, user_stats)
- ✅ Views for order book and recent trades
- ✅ Triggers for auto-updates
- ✅ Row Level Security policies

---

### 3. Test the Marketplace

#### Create a Test Property Token

First, tokenize a property to make it tradeable:

```typescript
// In your property tokenization flow
const property = await tokenizeProperty({
  property_id: 'some-uuid',
  token_name: 'Downtown Condo Token',
  token_symbol: 'DCOND',
  total_tokens: 10000,
  price_per_token: 50.00
});
```

#### Place Your First Order

```bash
# 1. Navigate to marketplace
open http://localhost:3000/marketplace

# 2. Click on a tokenized property

# 3. Sign in (if not already)

# 4. Place a buy order:
#    - Amount: 10 tokens
#    - Price: $50 per token
#    - Click "Buy DCOND"

# 5. Open another browser (incognito) and place a matching sell order

# 6. Watch the automatic order matching! ⚡
```

---

### 4. Verify On-Chain

After a trade executes:

1. Copy the transaction ID from the success message
2. Visit: `https://hashscan.io/testnet/transaction/{txId}`
3. See your trade settled on Hedera! 🎉

---

## 📋 Checklist

Before going live, ensure:

- [ ] Database migration applied
- [ ] `recharts` installed
- [ ] At least one property tokenized
- [ ] Test users have Hedera accounts set up
- [ ] Test users have completed KYC
- [ ] Environment variables configured:
  - `MY_ACCOUNT_ID`
  - `MY_PRIVATE_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## 🧪 Testing Scenarios

### Scenario 1: Simple Buy/Sell Match

```typescript
// User A: Place sell order
{
  order_type: 'sell',
  token_amount: 100,
  price_per_token: 50.00
}

// User B: Place buy order (higher price)
{
  order_type: 'buy',
  token_amount: 100,
  price_per_token: 51.00
}

// Expected: Instant match at $50 (maker price)
// Result: 100 tokens transferred, trade recorded
```

### Scenario 2: Partial Fill

```typescript
// User A: Place sell order
{
  order_type: 'sell',
  token_amount: 100,
  price_per_token: 50.00
}

// User B: Place buy order (smaller amount)
{
  order_type: 'buy',
  token_amount: 60,
  price_per_token: 50.00
}

// Expected: Partial fill
// Result: 
// - User B: 60 tokens bought (order filled)
// - User A: 60 tokens sold, 40 remaining (partially filled)
```

### Scenario 3: No Match

```typescript
// User A: Place sell order
{
  order_type: 'sell',
  token_amount: 100,
  price_per_token: 55.00
}

// User B: Place buy order (lower price)
{
  order_type: 'buy',
  token_amount: 100,
  price_per_token: 50.00
}

// Expected: No match
// Result: Both orders remain open in order book
```

---

## 🐛 Troubleshooting

### Issue: "Insufficient token balance"

**Solution:**
- User must own tokens before selling
- Check investments table for user's holdings
- Subtract tokens already in open sell orders

### Issue: "Token transfer failed"

**Cause:** Token not associated with buyer's account

**Solution:** Already fixed! Token association happens automatically before first trade.

### Issue: Order book not updating

**Solution:**
- Check Supabase realtime subscriptions
- Verify RLS policies allow read access
- Check browser console for WebSocket errors

### Issue: Chart shows no data

**Cause:** No completed trades yet for the property

**Solution:**
- Complete at least one trade
- Price history will automatically populate
- Wait 1-2 seconds for aggregation

---

## 📊 Monitoring

### Key Metrics to Watch

1. **Order Match Rate**
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE status IN ('filled', 'partially_filled')) * 100.0 / COUNT(*) as match_rate
   FROM marketplace_orders
   WHERE created_at > NOW() - INTERVAL '24 hours';
   ```

2. **Average Trade Size**
   ```sql
   SELECT AVG(token_amount) as avg_tokens, AVG(total_price) as avg_value
   FROM marketplace_trades
   WHERE status = 'completed'
     AND completed_at > NOW() - INTERVAL '24 hours';
   ```

3. **Active Traders**
   ```sql
   SELECT COUNT(DISTINCT user_id)
   FROM (
     SELECT buyer_id as user_id FROM marketplace_trades
     UNION
     SELECT seller_id as user_id FROM marketplace_trades
   ) t
   WHERE completed_at > NOW() - INTERVAL '24 hours';
   ```

---

## 🎯 Performance Benchmarks

### Expected Performance

- **Order Creation**: < 500ms
- **Order Matching**: < 1 second
- **Trade Execution**: 3-5 seconds (Hedera settlement)
- **Order Book Update**: < 100ms (realtime)
- **Chart Load**: < 2 seconds (100 data points)

### Load Testing

```bash
# Simulate 100 concurrent order placements
ab -n 100 -c 10 -T application/json -p order.json \
   -H "Authorization: Bearer $TOKEN" \
   http://localhost:3000/api/marketplace/orders
```

---

## 🔧 Configuration Options

### Trading Fees

Edit `src/lib/marketplace-trading.ts`:

```typescript
// Line ~170
const platformFeeRate = 0.005; // 0.5% default

// Change to desired rate:
const platformFeeRate = 0.001; // 0.1% (more competitive)
const platformFeeRate = 0.010; // 1.0% (more revenue)
```

### Order Expiration

Edit `src/components/marketplace/TradeForm.tsx`:

```typescript
// Add expiration (optional)
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

fetch('/api/marketplace/orders', {
  body: JSON.stringify({
    ...orderData,
    expires_at: expiresAt.toISOString()
  })
});
```

### Chart Intervals

Edit `src/components/marketplace/TradingChart.tsx`:

```typescript
// Line ~15: Add/remove intervals
const INTERVALS = [
  { value: '1m', label: '1m' },
  { value: '1h', label: '1h' },
  { value: '1d', label: '1D' },
  // Add custom intervals as needed
];
```

---

## 📱 Mobile Optimization

The marketplace is fully responsive, but for best mobile experience:

1. **Touch gestures** for chart navigation
2. **Larger tap targets** for order book prices
3. **Bottom sheet** for trade form on mobile
4. **Simplified chart** on small screens

To enable mobile optimizations, add:

```typescript
const isMobile = window.innerWidth < 768;
```

Then conditionally render simplified UI.

---

## 🚢 Deployment Checklist

Before deploying to production:

- [ ] Environment variables set on hosting platform
- [ ] Database migrations applied to production DB
- [ ] Hedera mainnet credentials configured (switch from testnet)
- [ ] SSL certificate for WebSocket connections
- [ ] CDN for static assets (images, charts)
- [ ] Error tracking (Sentry, LogRocket)
- [ ] Rate limiting on API endpoints
- [ ] Load balancer for multiple instances
- [ ] Database connection pooling
- [ ] Backup strategy for database

---

## 🎓 Learning Resources

### For Understanding Order Books

- [How Order Books Work](https://www.investopedia.com/terms/o/order-book.asp)
- [Market Making Basics](https://www.investopedia.com/terms/m/marketmaker.asp)

### For Hedera Development

- [Hedera Documentation](https://docs.hedera.com)
- [Hedera SDK Reference](https://docs.hedera.com/hedera/sdks-and-apis/sdks)

### For Trading UI Design

- [Binance Interface](https://www.binance.com/en/trade/BTC_USDT)
- [Coinbase Pro](https://pro.coinbase.com/)

---

## 💡 Pro Tips

1. **Liquidity Bootstrapping**
   - Incentivize early traders with fee rebates
   - Place strategic market-making orders
   - Partner with property owners to provide liquidity

2. **Price Discovery**
   - Show property appraisal values
   - Display rental yield estimates
   - Compare to similar properties

3. **User Engagement**
   - Push notifications for order fills
   - Email alerts for price movements
   - Leaderboards for top traders

4. **Trust Building**
   - Show all on-chain transaction links
   - Display real-time order book depth
   - Publish trading volume statistics

---

## 🆘 Support

### Getting Help

- **Documentation**: Read `SECONDARY_MARKETPLACE_DOCUMENTATION.md`
- **Code Comments**: All functions are well-documented
- **Examples**: Check the test scenarios above

### Common Questions

**Q: Can users trade without KYC?**
A: No, KYC verification is required for compliance.

**Q: What happens if Hedera transaction fails?**
A: Trade status is marked as 'failed' and no database updates occur.

**Q: Can I customize the trading fee?**
A: Yes, edit `platformFeeRate` in `marketplace-trading.ts`.

**Q: How do I add new timeframes to charts?**
A: Add to `INTERVALS` array in `TradingChart.tsx` and ensure database trigger supports it.

---

## 🎉 Success Indicators

You'll know it's working when:

- ✅ Users can see the marketplace listing
- ✅ Order book updates in real-time
- ✅ Charts display price history
- ✅ Orders automatically match
- ✅ Trades settle on-chain
- ✅ HashScan shows transactions
- ✅ Users receive tokens in their accounts

---

## 🏁 Next Steps

1. **Test thoroughly** with small amounts
2. **Gather user feedback** on interface
3. **Monitor performance** and optimize bottlenecks
4. **Add features** from the future enhancements list
5. **Scale gradually** as trading volume grows

---

**Ready to revolutionize real estate trading? Let's go! 🚀**

Questions? Issues? Check the main documentation or raise an issue in the repository.

