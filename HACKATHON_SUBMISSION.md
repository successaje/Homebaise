# Homebaise - Hackathon Submission

**🏆 Track:** Onchain Finance & Real-World Assets (RWA)

---

## 📦 Submission Contents

### Core Documentation
✅ **README.md** - Main project overview with quick start guide  
✅ **TECHNICAL_DOCUMENTATION.md** - Complete technical architecture  
✅ **PROJECT_SUMMARY.md** - Executive summary for judges  

### Key Resources
✅ **Presentation Slides** - [homebaise.pdf](homebaise.pdf)  
✅ **Pitch Video** - [YouTube](https://youtu.be/YH5-hDscbrM)  
✅ **Certificate** - [Download](cert/886eb452-88f0-489e-9772-b9605d6ba2ae.pdf)  
✅ **Live Demo** - [@homebaise_bot on Telegram](https://t.me/homebaise_bot)  

### Architecture
✅ **Flowchart** - [public/images/flowchart.png](public/images/flowchart.png) - Complete system architecture  

---

## 🌐 Hedera Services Used

### 1. Hedera Token Service (HTS)
**Why:** Predictable $0.05/$0.0001 fees enable micro-investments starting from $10 in Africa.

**Transaction Types:**
- `TokenCreateTransaction` - Property tokenization
- `TokenMintTransaction` - Additional supply
- `TokenAssociateTransaction` - User onboarding
- `TransferTransaction` - Token transfers

**Economic Justification:** Fixed fees ensure operational cost stability, essential for low-margin operations in African markets where traditional fees (8-11%) are prohibitive.

### 2. Hedera Consensus Service (HCS)
**Why:** $0.0001 per message ensures complete transparency without compromising margins.

**Transaction Types:**
- `TopicCreateTransaction` - Event logging setup
- `TopicMessageSubmitTransaction` - Immutable audit trails

**Economic Justification:** Eliminates fraud through tamper-proof audit trails, crucial for building trust in African real estate markets.

### 3. Native HBAR & Accounts
**Why:** 3-5 second finality with $0.0001 fees enables instant settlement at predictable costs.

**Transaction Types:**
- `AccountCreateTransaction` - Treasury account creation
- `TransferTransaction` - HBAR payments

**Economic Justification:** Matches mobile money speed with blockchain security, perfect for African users.

### 4. Mirror Node API
**Why:** FREE real-time balance queries without blockchain overhead.

**Usage:** Balance tracking, transaction history, token info queries.

---

## 📊 Deployed Hedera IDs (Testnet)

### Operator Account
- Account ID: `0.0.6615760` - Creates treasury accounts and tokens

### Treasury Accounts
- Format: `0.0.XXXXX` per property
- Stored in `property_treasury_accounts` table

### HTS Token IDs
- Format: `0.0.XXXXX` per tokenized property
- Stored with property records

### HCS Topic IDs
- Format: `0.0.XXXXX` per property
- Used for immutable event logging
- Stored in `property_treasury_accounts.topic_id`

---

## 🚀 Deployment Instructions

### Quick Start

```bash
# Clone repository
git clone https://github.com/successaje/Homebaise.git
cd homebaise

# Install dependencies
npm install

# Configure environment
cp env.example .env.local
# Edit .env.local with your credentials

# Run migrations
cd supabase && psql $DATABASE_URL < migrations/*.sql

# Start development
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- API: http://localhost:3000/api/*
- Bot: [@homebaise_bot](https://t.me/homebaise_bot) on Telegram

---

## 🤖 Bot Deployment to Render

The bot includes `bot/render.yaml` for easy Render deployment:

1. Connect GitHub repo to Render
2. Select `bot` directory
3. Set environment variables:
   - `TELEGRAM_BOT_TOKEN`
   - `HOMEBASE_API_URL`
   - `BOT_SERVER_TOKEN`
   - Supabase credentials
4. Deploy!

See [bot/DEPLOYMENT.md](bot/DEPLOYMENT.md) for complete guide.

---

## 🏗️ Architecture

```
Frontend (Next.js) → API → Supabase → Hedera Network
                            ↓
                HTS + HCS + HBAR + Mirror Node
```

See [TECHNICAL_DOCUMENTATION.md](TECHNICAL_DOCUMENTATION.md) for detailed architecture diagram.

---

## 💡 Innovation Highlights

1. **AI-Powered Valuation** - Ollama + DeepSeek for real-time property analysis
2. **Natural Language Bot** - Invest via Telegram with simple commands
3. **Token Collateralization** - Planned DeFi integration for property tokens
4. **ElizaOS Integration** - Intelligent agent workflows (planned)
5. **Native Hedera Plugin** - Simplified transaction execution (planned)

---

## 👥 Team

**Aje Success** - Founder & Fullstack Developer  
**Olaoye Trust Victor** - Realtor & Real Estate Consultant  
**Boyrn** - Social Media & Technical Writer  
**Nailer** - Developer & Contributor  

---

## 📈 Impact

- **$53B African remittances** → Real estate investments
- **$10 minimum** investment vs traditional $1,000+
- **8-10% cost savings** vs traditional real estate fees
- **3-5 second settlement** vs days for traditional transfers
- **Mobile-first** - No app download required

---

## 🎯 Live Demo

**Try it now:** [@homebaise_bot](https://t.me/homebaise_bot)

Example commands:
```
/start - Authenticate
/browse - List properties
/invest - "Invest $15 dollars in Accra EcoVillas Estate"
/portfolio - View investments
/balance - Check HBAR balance
```

---

## 📚 Documentation Links

- [Technical Documentation](TECHNICAL_DOCUMENTATION.md)
- [Property Tokenization](docs/PROPERTY_TOKENIZATION_README.md)
- [Secondary Marketplace](docs/SECONDARY_MARKETPLACE_README.md)
- [AI Valuation System](docs/AI_VALUATION_SYSTEM.md)
- [Bot Deployment Guide](bot/DEPLOYMENT.md)

---

**Built with ❤️ for Africa on Hedera Network** 🚀

