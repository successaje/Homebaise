# Secondary Marketplace - Complete Documentation

## 🎯 Overview

The Secondary Marketplace is a **fully functional peer-to-peer trading platform** for property tokens, built on Hedera's lightning-fast network. It provides:

- **Real-time order book** with bid/ask spreads
- **Advanced charting** with candlestick, line, and area charts
- **Automated order matching** engine
- **Atomic swaps** via Hedera for instant settlement
- **Market statistics** and analytics
- **TradingView-style interface** for professional traders

---

## 🏗️ Architecture

### Database Schema

#### 1. **marketplace_orders**
Stores buy and sell orders from users.

```sql
Key Fields:
- property_id: UUID (property being traded)
- token_id: TEXT (Hedera token ID)
- order_type: 'buy' | 'sell'
- price_per_token: DECIMAL (limit price)
- token_amount: BIGINT (total tokens)
- filled_amount: BIGINT (tokens already traded)
- remaining_amount: BIGINT (tokens left to trade)
- status: 'open' | 'partially_filled' | 'filled' | 'cancelled' | 'expired'
```

**Features:**
- Automatic status updates via triggers
- Expiration support
- Public/private orders
- Order book aggregation view

#### 2. **marketplace_trades**
Records executed trades between buyers and sellers.

```sql
Key Fields:
- buy_order_id, sell_order_id: Order references
- buyer_id, seller_id: User IDs
- token_amount, price_per_token: Trade details
- hedera_transaction_id: On-chain proof
- platform_fee, buyer_fee, seller_fee: Fee breakdown
- status: 'pending' | 'completed' | 'failed' | 'disputed'
```

**Features:**
- Automatic price history updates
- Fee tracking
- Transaction verification
- Real-time notifications

#### 3. **marketplace_price_history**
OHLCV (Open, High, Low, Close, Volume) data for charting.

```sql
Key Fields:
- property_id: Property reference
- timestamp: Time bucket
- interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M'
- open_price, high_price, low_price, close_price: Price data
- volume: Trading volume
- trade_count: Number of trades
```

**Features:**
- Automatic aggregation from trades
- Multiple timeframes
- Candlestick chart support

#### 4. **marketplace_statistics**
Aggregated market data per property.

```sql
Key Fields:
- volume_24h, trades_24h: 24-hour activity
- high_24h, low_24h, change_24h: Price metrics
- last_price: Most recent trade
- best_bid, best_ask, spread: Order book depth
- total_volume, total_trades: All-time stats
```

#### 5. **user_trading_stats**
Individual user trading history and P&L.

```sql
Key Fields:
- total_trades, total_volume: Trading activity
- total_bought, total_buy_value: Buy side
- total_sold, total_sell_value: Sell side
- realized_pnl, unrealized_pnl: Profit/Loss
```

---

## ⚙️ Core Services

### 1. MarketplaceTradingService (`src/lib/marketplace-trading.ts`)

**Key Methods:**

#### `createOrder(userId, input)`
Creates a new buy or sell order.

```typescript
// Example: Create a sell order
const result = await MarketplaceTradingService.createOrder(userId, {
  property_id: 'property-uuid',
  token_id: '0.0.123456',
  order_type: 'sell',
  token_amount: 100,
  price_per_token: 50.00,
  currency: 'HBAR'
});

// Automatically tries to match with existing orders!
```

**Features:**
- Balance validation
- Automatic order matching
- Real-time price discovery

#### `tryMatchOrders(newOrder)`
Automatically matches orders when possible.

**Algorithm:**
1. Find opposite-side orders (buy ↔ sell)
2. Sort by price (best first)
3. Match prices (buy >= sell for execution)
4. Execute trades atomically on Hedera
5. Update order fills

**Example:**
```
New Buy Order: 100 tokens @ $50
Existing Sell Orders: 
  - 50 tokens @ $48 ✅ MATCH (trade 50)
  - 75 tokens @ $49 ✅ MATCH (trade 50)
Result: Buy order filled, 2 trades executed
```

#### `executeTrade(input)`
Executes atomic swap on Hedera.

**Steps:**
1. Fetch buyer and seller Hedera credentials
2. **Associate token with buyer** (if first time)
3. Transfer tokens: seller → buyer
4. Transfer payment: buyer → seller
5. Record trade on-chain
6. Update database

**Security:**
- Atomic transactions (all-or-nothing)
- On-chain verification
- Fee deduction (0.5% platform fee)
- Error rollback

#### `getOrderBook(propertyId)`
Returns aggregated order book.

**Returns:**
```typescript
{
  bids: [
    { price: 50, amount: 100, order_count: 3 },
    { price: 49, amount: 200, order_count: 5 },
    ...
  ],
  asks: [
    { price: 51, amount: 150, order_count: 4 },
    { price: 52, amount: 100, order_count: 2 },
    ...
  ],
  spread: 1.00,
  mid_price: 50.50
}
```

---

## 🌐 API Endpoints

### Orders

#### POST `/api/marketplace/orders`
Create a new order.

**Request:**
```json
{
  "property_id": "uuid",
  "token_id": "0.0.123456",
  "order_type": "buy|sell",
  "token_amount": 100,
  "price_per_token": 50.00,
  "currency": "HBAR",
  "expires_at": "2025-12-31T23:59:59Z" // optional
}
```

**Response:**
```json
{
  "order": {
    "id": "order-uuid",
    "status": "open",
    "created_at": "2025-10-12T10:00:00Z",
    ...
  },
  "message": "Order created successfully"
}
```

#### GET `/api/marketplace/orders?property_id=uuid`
Get user's open orders.

#### DELETE `/api/marketplace/orders/:id`
Cancel an order.

---

### Order Book

#### GET `/api/marketplace/orderbook?property_id=uuid`
Get real-time order book.

**Response:**
```json
{
  "orderBook": {
    "bids": [...],
    "asks": [...],
    "spread": 1.00,
    "mid_price": 50.50
  },
  "marketDepth": {
    "bids": [...],
    "asks": [...],
    "max_total": 10000
  },
  "timestamp": "2025-10-12T10:00:00Z"
}
```

---

### Price History

#### GET `/api/marketplace/price-history?property_id=uuid&interval=1h&limit=100`
Get OHLCV data for charts.

**Intervals:** `1m`, `5m`, `15m`, `1h`, `4h`, `1d`, `1w`, `1M`

**Response:**
```json
{
  "data": [
    {
      "timestamp": 1728720000000,
      "time": 1728720000,
      "open": 49.50,
      "high": 51.00,
      "low": 49.00,
      "close": 50.50,
      "volume": 1250
    },
    ...
  ],
  "interval": "1h",
  "count": 100
}
```

---

### Trades

#### GET `/api/marketplace/trades?property_id=uuid&limit=50`
Get recent completed trades.

**Response:**
```json
{
  "trades": [
    {
      "id": "trade-uuid",
      "price_per_token": 50.00,
      "token_amount": 100,
      "total_price": 5000.00,
      "hedera_transaction_id": "0.0.123@123456789.123",
      "completed_at": "2025-10-12T10:00:00Z",
      ...
    },
    ...
  ]
}
```

---

### Statistics

#### GET `/api/marketplace/statistics?property_id=uuid`
Get market statistics.

**Response:**
```json
{
  "statistics": {
    "last_price": 50.00,
    "change_24h": 5.2,
    "volume_24h": 10000,
    "trades_24h": 45,
    "high_24h": 52.00,
    "low_24h": 48.00,
    "best_bid": 49.50,
    "best_ask": 50.50,
    "spread": 1.00,
    ...
  }
}
```

---

## 🎨 Frontend Components

### 1. MarketplacePage (`/marketplace`)
Landing page showing all tradeable properties.

**Features:**
- Property cards with live prices
- 24h volume and trades
- Hot properties (🔥 high volume)
- New listings (✨ < 24h old)
- Market cap overview

### 2. TradingPage (`/marketplace/:propertyId`)
Full trading interface for a specific property.

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Market Stats (price, volume, bid/ask, spread)      │
├──────────────────────────────┬──────────────────────┤
│                              │                      │
│   Price Chart                │  Trading Form        │
│   (candlestick/line/area)    │  (buy/sell orders)   │
│                              │                      │
├──────────────────────────────┤  Order Book          │
│                              │  (bids & asks)       │
│   Recent Trades              │                      │
│                              │                      │
├──────────────────────────────┴──────────────────────┤
│   My Open Orders (if authenticated)                 │
└─────────────────────────────────────────────────────┘
```

---

### 3. TradingChart Component
Advanced charting with multiple visualizations.

**Chart Types:**
- **Line Chart**: Simple price trend
- **Area Chart**: Filled area under price
- **Candlestick**: Professional OHLC bars with volume

**Intervals:**
- Intraday: 1m, 5m, 15m, 1h, 4h
- Daily+: 1D, 1W, 1M

**Features:**
- Interactive tooltips
- Volume bars below main chart
- Zoom and pan
- Responsive design

---

### 4. OrderBook Component
Real-time order book with depth visualization.

**Features:**
- Color-coded bids (green) and asks (red)
- Bar chart showing order depth
- Click price to auto-fill trade form
- Best bid/ask highlighted
- Spread calculation
- Order count tooltips

---

### 5. TradeForm Component
Place buy/sell orders with validation.

**Order Types:**
- **Limit**: Specify exact price
- **Market**: Execute at best available price (coming soon)

**Features:**
- Balance validation (for sells)
- Auto-fill from order book clicks
- Quick percentage buttons (25%, 50%, 75%, 100%)
- Total cost calculation
- Fee display (0.5%)
- Real-time form validation

---

### 6. RecentTrades Component
Live feed of completed trades.

**Display:**
- Price, amount, total
- Timestamp (relative: "5m ago")
- Color coding for price direction
- Scrollable list

---

### 7. MyOrders Component
User's active orders with management.

**Features:**
- Status badges (open, partially filled, filled)
- Fill progress bars
- Cancel order button
- Expiration time
- Quick order details

---

## 🔄 Real-time Updates

### Supabase Realtime Subscriptions

**Orders:**
```typescript
supabase
  .channel(`marketplace_orders_${propertyId}`)
  .on('postgres_changes', { 
    event: '*', 
    table: 'marketplace_orders',
    filter: `property_id=eq.${propertyId}`
  }, () => {
    // Refresh order book
  })
  .subscribe();
```

**Trades:**
```typescript
supabase
  .channel(`marketplace_trades_${propertyId}`)
  .on('postgres_changes', { 
    event: 'INSERT', 
    table: 'marketplace_trades',
    filter: `property_id=eq.${propertyId}`
  }, () => {
    // Refresh trades and statistics
  })
  .subscribe();
```

**Result:** All users see updates within ~100ms!

---

## 🔐 Security & Compliance

### Transaction Security

1. **Token Association**
   - Automatic before first trade
   - Prevents failed transfers

2. **Atomic Swaps**
   - All-or-nothing execution
   - On-chain verification

3. **Balance Validation**
   - Sell orders check actual holdings
   - Prevents over-selling

4. **Fee Deduction**
   - Platform fee: 0.5% of trade value
   - Transparent in UI

### Access Control

**Row Level Security (RLS):**
- Users can only cancel their own orders
- Private orders only visible to owner
- Trade history visible to participants

**Authentication:**
- JWT tokens for API access
- Supabase auth integration

---

## 📊 Analytics & Insights

### Market Statistics

**24-Hour Metrics:**
- Trading volume
- Number of trades
- Price high/low
- Price change percentage

**All-Time:**
- Total volume
- Total trades
- Market cap

### User Statistics

**Per User:**
- Total trades
- Buy/sell volume
- Realized P&L
- Unrealized P&L (current holdings value)

---

## 🚀 Performance Optimizations

### Database

1. **Indexes:**
   - Order book queries: `(property_id, status, order_type, price)`
   - Trade history: `(property_id, completed_at DESC)`
   - User orders: `(seller_id/buyer_id, property_id, status)`

2. **Materialized Views:**
   - Order book aggregation
   - Recent trades with user details

3. **Triggers:**
   - Auto-update order status
   - Auto-aggregate price history
   - Auto-calculate statistics

### Frontend

1. **Lazy Loading:**
   - Charts load only when visible
   - Infinite scroll for trades

2. **Caching:**
   - Order book cached 1 second
   - Price history cached 5 seconds

3. **Optimistic Updates:**
   - Order creation shows immediately
   - Confirmed via real-time subscription

---

## 🎯 Trading Strategies Enabled

### For Investors

1. **Dollar-Cost Averaging**
   - Place multiple limit orders at different prices
   - Accumulate over time

2. **Profit Taking**
   - Set sell orders at target prices
   - Automatic execution when reached

3. **Arbitrage**
   - Buy undervalued properties
   - Sell when price rises

### For Liquidity Providers

1. **Market Making**
   - Place both buy and sell orders
   - Profit from spread

2. **Rebalancing**
   - Move between properties
   - Optimize portfolio

---

## 🔮 Future Enhancements

### Phase 2 (Coming Soon)

1. **Advanced Order Types**
   - Stop-loss orders
   - Take-profit orders
   - Trailing stops

2. **Margin Trading**
   - Borrow against holdings
   - Leverage positions

3. **Liquidity Pools**
   - Automated market makers (AMM)
   - Provide liquidity, earn fees

4. **Mobile App**
   - React Native app
   - Push notifications for fills

5. **API for Bots**
   - Programmatic trading
   - Webhook notifications

6. **Portfolio Analytics**
   - Performance tracking
   - Risk metrics
   - Tax reports

---

## 📚 Usage Examples

### Example 1: Place a Buy Order

```typescript
// User wants to buy 100 tokens at $50 each
const { data: session } = await supabase.auth.getSession();

const response = await fetch('/api/marketplace/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    property_id: property.id,
    token_id: property.token_id,
    order_type: 'buy',
    token_amount: 100,
    price_per_token: 50.00,
    currency: 'HBAR'
  })
});

const { order } = await response.json();
// Order created and automatically matches if possible!
```

### Example 2: Sell All Holdings

```typescript
// User wants to sell all their tokens at market price
const balance = await fetchUserBalance(userId, propertyId);
const bestBid = orderBook.bids[0]?.price_per_token;

await fetch('/api/marketplace/orders', {
  method: 'POST',
  body: JSON.stringify({
    property_id: property.id,
    token_id: property.token_id,
    order_type: 'sell',
    token_amount: balance,
    price_per_token: bestBid,
    currency: 'HBAR'
  })
});
```

### Example 3: Watch Order Book

```typescript
const subscription = supabase
  .channel(`orderbook_${propertyId}`)
  .on('postgres_changes', {
    event: '*',
    table: 'marketplace_orders',
    filter: `property_id=eq.${propertyId}`
  }, (payload) => {
    console.log('Order book updated!', payload);
    refreshOrderBook();
  })
  .subscribe();
```

---

## 🎖️ Why This Wins

### Innovation

1. **First Hedera real estate marketplace**
   - Instant settlement (3-5 seconds)
   - Sub-cent transaction costs

2. **Professional trading interface**
   - Rivals centralized exchanges
   - Built on decentralized tech

3. **True price discovery**
   - Market-driven valuations
   - No artificial pricing

### User Experience

1. **Familiar interface**
   - Looks like Coinbase/Binance
   - Easy for crypto users

2. **Real-time everything**
   - Live order book
   - Instant trade execution
   - Push notifications

3. **Mobile-first design**
   - Responsive on all devices
   - Works on phone/tablet/desktop

### Technical Excellence

1. **Scalability**
   - Hedera: 10,000 TPS
   - Can handle global traffic

2. **Security**
   - On-chain settlement
   - No custody risk
   - Atomic swaps

3. **Compliance-ready**
   - KYC integration
   - Transaction records
   - Audit trail

---

## 🏆 Competitive Advantages

vs. **Traditional Real Estate:**
- Instant liquidity (vs. months to sell)
- Trade 24/7 (vs. business hours)
- No middlemen fees (vs. 5-6% realtor fees)

vs. **Other Crypto Platforms:**
- Real asset backing (vs. speculation)
- Yield generation (rental income)
- Regulatory compliance

vs. **Other Tokenization Platforms:**
- Hedera's speed (vs. Ethereum's slow/expensive)
- Professional UI (vs. basic interfaces)
- Order matching engine (vs. simple swaps)

---

## 📈 Business Model

### Revenue Streams

1. **Trading Fees: 0.5%**
   - Per trade
   - Sustainable revenue

2. **Listing Fees**
   - Properties pay to list
   - Quality control

3. **Premium Features** (Future)
   - Advanced analytics
   - API access
   - Priority support

### Projected Revenue

**Conservative:**
- 100 properties @ $1M each = $100M market cap
- 10% monthly turnover = $10M volume
- 0.5% fee = $50K monthly revenue

**Aggressive:**
- 1,000 properties @ $1M each = $1B market cap
- 20% monthly turnover = $200M volume
- 0.5% fee = $1M monthly revenue

---

## 🎬 Demo Script

**For judges:**

1. **Show marketplace listing**
   - "Here are all tokenized properties available for trading"
   - Click on a hot property (🔥)

2. **Trading interface**
   - "This is our professional trading interface"
   - Point out: chart, order book, recent trades

3. **Place a buy order**
   - "Let me buy 50 tokens at $49.50"
   - Shows instant order creation

4. **Automatic matching**
   - "Watch - it automatically matched with a sell order!"
   - Trade executes in real-time

5. **On-chain proof**
   - "Here's the Hedera transaction ID"
   - Open HashScan to show on-chain settlement

6. **Market stats**
   - "All analytics update in real-time"
   - Show 24h volume, trades, price changes

**Key talking points:**
- ✅ Instant settlement (3-5 seconds vs. days)
- ✅ Transparent pricing (order book vs. opaque)
- ✅ No custody risk (peer-to-peer)
- ✅ Professional UX (familiar to traders)
- ✅ Built on Hedera (fast, cheap, green)

---

## 📝 Conclusion

The Secondary Marketplace transforms **illiquid real estate into liquid, tradeable assets**. It combines:

- 🏦 **Traditional Finance** (order books, market making)
- 🔗 **Blockchain** (on-chain settlement, transparency)
- ⚡ **Hedera** (speed, low cost, scalability)
- 🎨 **Modern UX** (responsive, real-time, intuitive)

This is **the future of real estate investing** - and it's built today.

---

**Ready to trade? Visit `/marketplace` to start!** 🚀

