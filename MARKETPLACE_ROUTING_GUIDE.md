# Marketplace Routing Guide

## 🗺️ Complete Route Structure

### Primary Marketplace Routes

| Route | Purpose | Description |
|-------|---------|-------------|
| `/marketplace` | Browse | Main marketplace - see all tradeable properties |
| `/marketplace/[propertyId]` | Trade | Trading interface for specific property |

### Supporting Routes (Existing)

| Route | Purpose |
|-------|---------|
| `/properties` | Browse all properties |
| `/properties/[id]` | Property details |
| `/properties/[id]/invest` | Initial investment |
| `/dashboard` | User dashboard |
| `/portfolio` | User portfolio |
| `/market` | Market listings |
| `/yield` | Yield tracking |

---

## 🔗 Navigation Added

### 1. Homepage Navigation (`/`)
Added link in main navigation bar:
```tsx
<Link href="/marketplace" className="text-emerald-400 hover:text-emerald-300">
  🔥 Trade
</Link>
```

**Users can now:**
- Click "🔥 Trade" from homepage → Go to marketplace listing

---

### 2. Properties Page (`/properties`)
Added link in top navigation:
```tsx
<Link href="/marketplace" className="text-emerald-400 hover:text-emerald-300">
  🔥 Trade Tokens
</Link>
```

**Users can now:**
- Browse properties → Click "🔥 Trade Tokens" → Trade on marketplace

---

### 3. Property Cards (Automatic)
The marketplace pages already have property cards that link correctly:

```tsx
<Link href={`/marketplace/${property.id}`}>
  {/* Property card */}
</Link>
```

---

## 🎯 User Flow Examples

### Flow 1: From Homepage to Trading

```
1. User visits homepage (/)
2. Clicks "🔥 Trade" in nav
3. Lands on /marketplace
4. Sees all tradeable properties
5. Clicks a property card
6. Lands on /marketplace/[propertyId]
7. Can now place buy/sell orders!
```

### Flow 2: From Properties Page to Trading

```
1. User browsing /properties
2. Sees a tokenized property
3. Clicks "🔥 Trade Tokens" in nav
4. Goes to /marketplace
5. Finds the property
6. Clicks to trade
7. Places orders!
```

### Flow 3: From Investment to Trading

```
1. User invests in property (/properties/[id]/invest)
2. Receives tokens
3. Later wants to sell
4. Goes to /marketplace
5. Finds their property
6. Places sell order
7. Trade executes!
```

---

## 📋 How to Access Each Feature

### Browse Tradeable Properties
**Route:** `/marketplace`

**How to get there:**
- Click "🔥 Trade" from homepage
- Click "🔥 Trade Tokens" from properties page
- Navigate directly to `/marketplace`

**What you see:**
- All tokenized properties
- Filter by Hot/New
- 24h volume & trades
- Market statistics
- Property cards (click to trade)

---

### Trade a Specific Property
**Route:** `/marketplace/[propertyId]`

**How to get there:**
- From marketplace listing → Click property card
- Direct link: `/marketplace/123e4567-e89b-12d3-a456-426614174000`

**What you see:**
- Professional trading interface
- Price charts (candlestick/line/area)
- Order book (bids & asks)
- Trade form (buy/sell)
- Recent trades
- Your open orders (if logged in)

---

## 🔄 Route Parameters

### Dynamic Routes

#### `/marketplace/[propertyId]`
- `propertyId` = UUID of the property
- Example: `/marketplace/123e4567-e89b-12d3-a456-426614174000`

**Get propertyId from:**
```typescript
// In property cards
const { id } = property;

// Link to trading page
<Link href={`/marketplace/${id}`}>Trade Now</Link>
```

---

## 🎨 Styling Conventions

### Navigation Link Styles

**Active/Special Route (Marketplace):**
```tsx
className="text-emerald-400 hover:text-emerald-300 font-medium"
```
- Emerald color (brand color)
- 🔥 emoji for attention
- Font medium for emphasis

**Regular Routes:**
```tsx
className="text-gray-300 hover:text-white"
```
- Gray by default
- White on hover
- Normal font weight

---

## 🛠️ Adding More Navigation Links

### To Add Marketplace to Other Pages:

**Template:**
```tsx
<Link 
  href="/marketplace" 
  className="text-emerald-400 hover:text-emerald-300 font-medium"
>
  🔥 Trade Tokens
</Link>
```

**Add to:**
- Dashboard page (`/dashboard`)
- Portfolio page (`/portfolio`)
- Market page (`/market`)
- Yield page (`/yield`)
- Profile page (`/profile`)

**Example for Dashboard:**
```tsx
// In src/app/dashboard/page.tsx
<div className="flex items-center space-x-4">
  <Link href="/marketplace" className="text-emerald-400 hover:text-emerald-300">
    🔥 Trade
  </Link>
  <Link href="/profile" className="text-gray-300 hover:text-white">
    Profile
  </Link>
  {isAdmin && (
    <Link href="/admin" className="text-gray-300 hover:text-white">
      Admin
    </Link>
  )}
</div>
```

---

## 📱 Mobile Navigation

The marketplace is fully responsive. On mobile:
- Navigation collapses to hamburger menu
- All links work the same
- Trading interface adapts to screen size

---

## 🔍 How Properties Become Tradeable

### Requirements for Property to Show in Marketplace:

1. **Must be tokenized**
   ```sql
   status = 'tokenized'
   ```

2. **Must have token_id**
   ```sql
   token_id IS NOT NULL
   ```

3. **Token must be Hedera token**
   - Created via Hedera SDK
   - Stored in property_treasury_accounts table

### Automatic Listing:
Once a property is tokenized, it automatically appears in:
- `/marketplace` listing
- Can be traded via `/marketplace/[propertyId]`

---

## 🎯 Quick Links for Testing

### Test URLs (Local Development)

```bash
# Marketplace Listing
http://localhost:3000/marketplace

# Trading Interface (replace with actual UUID)
http://localhost:3000/marketplace/[your-property-uuid]

# From Homepage
http://localhost:3000
# → Click "🔥 Trade"

# From Properties
http://localhost:3000/properties
# → Click "🔥 Trade Tokens"
```

---

## 📊 Route Analytics (To Add)

Track which routes users take:

```typescript
// In marketplace pages
useEffect(() => {
  // Track page view
  analytics.track('Marketplace Visited', {
    route: window.location.pathname,
    referrer: document.referrer
  });
}, []);
```

---

## 🚀 Next Steps

### 1. Test the Routes
```bash
# Start dev server
npm run dev

# Visit each route:
- http://localhost:3000
- Click "🔥 Trade"
- Browse properties
- Click a property
- See trading interface
```

### 2. Add More Links
Consider adding marketplace link to:
- [ ] Dashboard
- [ ] Portfolio
- [ ] Property detail pages
- [ ] User profile
- [ ] Footer

### 3. Create Breadcrumbs
Add breadcrumb navigation:
```tsx
<div className="text-sm text-gray-400">
  <Link href="/">Home</Link> › 
  <Link href="/marketplace">Marketplace</Link> › 
  <span>Property Name</span>
</div>
```

---

## 🐛 Troubleshooting

### Route Not Found (404)

**Issue:** `/marketplace` shows 404

**Solution:** 
- Check that files exist:
  - `src/app/marketplace/page.tsx`
  - `src/app/marketplace/[propertyId]/page.tsx`
- Restart dev server: `npm run dev`

### Property Not Showing in Marketplace

**Issue:** Tokenized property doesn't appear

**Solution:**
Check property status:
```sql
SELECT id, name, status, token_id 
FROM properties 
WHERE id = 'your-uuid';

-- Status should be 'tokenized'
-- token_id should not be null
```

### Trading Page Blank

**Issue:** `/marketplace/[id]` loads but shows nothing

**Solution:**
1. Check property exists in database
2. Verify propertyId is correct UUID format
3. Check browser console for errors
4. Ensure `recharts` is installed

---

## 📝 Summary

### Routes Created:
- ✅ `/marketplace` - Browse tradeable properties
- ✅ `/marketplace/[propertyId]` - Trade specific property

### Navigation Updated:
- ✅ Homepage - Added "🔥 Trade" link
- ✅ Properties - Added "🔥 Trade Tokens" link

### How to Access:
1. Click "🔥 Trade" from any page with the link
2. Navigate to marketplace listing
3. Click property card
4. Start trading!

---

## 🎉 You're Ready!

The marketplace is now fully integrated into your app's navigation. Users can:
- Discover it from multiple entry points
- Browse tradeable properties easily
- Jump straight into trading
- Navigate back to other sections

**Start testing:** `npm run dev` and visit `http://localhost:3000` 🚀

