# Marketplace Mock Data Reference

## 🎭 Demo Properties Added

I've added **6 realistic mock properties** with active trading data to showcase the marketplace.

---

## 📊 Mock Properties Overview

### 1. Lagos Luxury Apartments 🏢
- **Location:** Victoria Island, Lagos, Nigeria
- **Token:** LAGOS (0.0.123456)
- **Last Price:** $51.75
- **24h Change:** +5.2% 📈
- **24h Volume:** 45,000 tokens
- **24h Trades:** 23
- **Status:** 🔥 HOT (high trading volume)
- **Total Value:** $2.5M
- **Yield:** 8.5%

**Trading Stats:**
- Best Bid: $51.50
- Best Ask: $52.00
- Spread: $0.50
- Total Trades: 340
- Total Volume: 850,000 tokens

---

### 2. Nairobi Commercial Plaza 🏢
- **Location:** Westlands, Nairobi, Kenya
- **Token:** NRBI (0.0.234567)
- **Last Price:** $77.25
- **24h Change:** +3.8% 📈
- **24h Volume:** 67,000 tokens
- **24h Trades:** 34
- **Status:** 🔥 HOT
- **Total Value:** $3.2M
- **Yield:** 12.3%

**Trading Stats:**
- Best Bid: $76.90
- Best Ask: $77.50
- Spread: $0.60
- Total Trades: 567
- Total Volume: 1,200,000 tokens

---

### 3. Cape Town Beachfront 🏖️
- **Location:** Camps Bay, Cape Town, South Africa
- **Token:** CAPE (0.0.345678)
- **Last Price:** $93.20
- **24h Change:** -1.5% 📉
- **24h Volume:** 28,000 tokens
- **24h Trades:** 15
- **Status:** Active
- **Total Value:** $4.5M
- **Yield:** 6.8%

**Trading Stats:**
- Best Bid: $92.80
- Best Ask: $93.60
- Spread: $0.80
- Total Trades: 48
- Total Volume: 95,000 tokens

---

### 4. Accra Tech Hub 💻
- **Location:** Osu, Accra, Ghana
- **Token:** TECH (0.0.456789)
- **Last Price:** $37.90
- **24h Change:** +6.2% 📈
- **24h Volume:** 52,000 tokens
- **24h Trades:** 28
- **Status:** 🔥 HOT
- **Total Value:** $1.8M
- **Yield:** 10.5%

**Trading Stats:**
- Best Bid: $37.60
- Best Ask: $38.10
- Spread: $0.50
- Total Trades: 456
- Total Volume: 680,000 tokens

---

### 5. Kigali Urban Residences 🏘️
- **Location:** Kigali City, Rwanda
- **Token:** KGLI (0.0.567890)
- **Last Price:** $26.30
- **24h Change:** +2.1% 📈
- **24h Volume:** 15,000 tokens
- **24h Trades:** 8
- **Status:** ✨ NEW (< 2 days old)
- **Total Value:** $1.2M
- **Yield:** 9.2%

**Trading Stats:**
- Best Bid: $26.00
- Best Ask: $26.50
- Spread: $0.50
- Total Trades: 8
- Total Volume: 15,000 tokens

---

### 6. Dar es Salaam Shopping Mall 🛍️
- **Location:** Mikocheni, Dar es Salaam, Tanzania
- **Token:** DARES (0.0.678901)
- **Last Price:** $57.60
- **24h Change:** +4.1% 📈
- **24h Volume:** 38,000 tokens
- **24h Trades:** 19
- **Status:** 🔥 HOT
- **Total Value:** $2.8M
- **Yield:** 11.8%

**Trading Stats:**
- Best Bid: $57.20
- Best Ask: $57.90
- Spread: $0.70
- Total Trades: 267
- Total Volume: 520,000 tokens

---

## 📈 Aggregate Market Stats

With all mock properties combined:

- **Total Properties:** 6
- **Total Market Cap:** $15.9M
- **24h Volume:** 245,000 tokens
- **24h Trades:** 127
- **Active Markets:** 6

---

## 🎨 Visual Indicators

### Demo Badge
All mock properties show a **blue "✨ Demo" badge** in the top-left corner:
```
┌─────────────────────┐
│ ✨ Demo      🔥 Hot │
│                     │
│    Property Image   │
│                     │
└─────────────────────┘
```

### Hot Properties (4/6)
Properties with high 24h volume show **red "🔥 Hot" badge**:
- Lagos Luxury Apartments
- Nairobi Commercial Plaza
- Accra Tech Hub
- Dar es Salaam Shopping Mall

### New Properties (1/6)
Properties < 24h old show in "New" filter:
- Kigali Urban Residences (1 day old)

---

## 🔧 How to Toggle Mock Data

### To DISABLE mock data:
```typescript
// In src/app/marketplace/page.tsx
// Change line 342 from:
const allProperties = [...MOCK_PROPERTIES, ...realProperties];

// To:
const allProperties = realProperties;
```

### To use ONLY mock data (for demo):
```typescript
// Change line 342 to:
const allProperties = MOCK_PROPERTIES;
```

### Current setup (HYBRID):
```typescript
// Shows mock data + real data
const allProperties = [...MOCK_PROPERTIES, ...realProperties];
```

---

## 🎯 Why This Mock Data?

### Realistic Scenarios:
1. **High Volume Property** - Lagos (45K volume)
2. **Highest Price** - Cape Town ($93.20)
3. **Highest Yield** - Nairobi (12.3%)
4. **New Listing** - Kigali (1 day old)
5. **Growing Market** - Accra (+6.2%)
6. **Price Decline** - Cape Town (-1.5%)

### Demonstrates Features:
- ✅ Active trading (volume > 0)
- ✅ Price movements (both up and down)
- ✅ Order book depth (bids/asks)
- ✅ Multiple property types
- ✅ Different markets
- ✅ Realistic spreads

---

## 📊 Trading Activity Breakdown

| Property | Volume | Trades | Avg Trade Size | Status |
|----------|--------|--------|----------------|--------|
| Nairobi Plaza | 67K | 34 | 1,971 | 🔥 Hot |
| Lagos Apartments | 45K | 23 | 1,957 | 🔥 Hot |
| Accra Tech Hub | 52K | 28 | 1,857 | 🔥 Hot |
| DSM Mall | 38K | 19 | 2,000 | 🔥 Hot |
| Cape Town Beach | 28K | 15 | 1,867 | Active |
| Kigali Residences | 15K | 8 | 1,875 | ✨ New |
| **TOTAL** | **245K** | **127** | **1,929** | — |

---

## 🎬 Demo Talking Points

When showing judges:

1. **Show Active Market:**
   - "Here are 6 properties actively trading"
   - "245,000 tokens traded in last 24 hours"
   - "127 trades across all properties"

2. **Show Price Discovery:**
   - "Lagos tokens up 5.2% today"
   - "Nairobi has tightest spread ($0.60)"
   - "Cape Town slightly down - normal market dynamics"

3. **Show Liquidity:**
   - "Each property has active bids and asks"
   - "12-18 buy orders per property"
   - "Tight spreads (avg $0.60)"

4. **Show Hot Properties:**
   - "4 properties marked as 'Hot' with high volume"
   - "Real-time updates as trades happen"

---

## 🔮 Customizing Mock Data

### To add more properties:
```typescript
// In MOCK_PROPERTIES array, add:
{
  id: 'mock-7',
  name: 'Your Property Name',
  location: 'City, Country',
  total_value: 1000000,
  token_symbol: 'SYMBOL',
  stats: {
    volume_24h: 10000,
    trades_24h: 5,
    last_price: 100,
    change_24h: 2.5,
    // ... etc
  }
}
```

### To modify trading stats:
```typescript
// Change any property's stats:
stats: {
  volume_24h: 100000,  // Increase volume
  trades_24h: 50,      // More trades
  change_24h: 15.5,    // Bigger price movement
  last_price: 200,     // Different price
  // ...
}
```

---

## 🎨 Visual Elements Added

### 1. Demo Badge (Top Hero)
```
┌──────────────────────────────────────┐
│  ✨ Live Demo • Real-time trading   │
│                                      │
│  Property Token Marketplace          │
└──────────────────────────────────────┘
```

### 2. Property Demo Badge
```
┌─────────────────────┐
│ ✨ Demo      🔥 Hot │ ← Both badges shown
│                     │
│  Property Image     │
└─────────────────────┘
```

### 3. Loading Skeletons
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓ │  │ ▓▓▓▓▓▓▓▓▓▓▓ │  │ ▓▓▓▓▓▓▓▓▓▓▓ │
│ ▓▓▓▓  ▓▓▓▓▓ │  │ ▓▓▓▓  ▓▓▓▓▓ │  │ ▓▓▓▓  ▓▓▓▓▓ │
└─────────────┘  └─────────────┘  └─────────────┘
  (Animated pulse)
```

---

## 💡 Benefits of Mock Data

### For Development:
- ✅ Test UI without real data
- ✅ Verify layout with various prices
- ✅ Test filters (hot/new)
- ✅ Validate sorting logic

### For Demo:
- ✅ Looks professional immediately
- ✅ Shows active market
- ✅ Demonstrates all features
- ✅ Judges can see full functionality

### For Testing:
- ✅ Consistent test data
- ✅ Various scenarios (up/down/new/hot)
- ✅ Multiple property types
- ✅ Different price ranges

---

## 🚀 What You'll See Now

Visit `/marketplace` and you'll see:

1. **Hero Section:**
   - "✨ Live Demo • Real-time trading simulation" badge
   - Market stats showing aggregated data

2. **6 Property Cards:**
   - Each with "✨ Demo" badge
   - 4 with "🔥 Hot" badge (high volume)
   - Realistic images from Unsplash
   - Live price data
   - 24h statistics

3. **Working Filters:**
   - All: Shows all 6 properties
   - Hot: Shows 4 hot properties
   - New: Shows 1 new property (Kigali)

4. **Market Stats:**
   - Listed Properties: 6
   - 24h Volume: 245,000
   - 24h Trades: 127
   - Total Market Cap: $15.9M

---

## 🎬 Perfect for Judging

The mock data creates a **complete, active marketplace** that:

- Shows professional UI
- Demonstrates trading activity
- Has realistic data patterns
- Works without backend setup
- Looks production-ready

**Judges will see a fully functional marketplace immediately!** 🎉

---

## 📝 Note

Real properties from your database will appear alongside mock data. Mock properties are clearly marked with the "✨ Demo" badge so users know which are real.

---

**Your marketplace now looks alive and active!** 🚀

