# Homebaise - Technical Documentation

> **Tokenizing Africa's Real Estate on Hedera Network**

**🏆 Hackathon Track:** Onchain Finance & Real-World Assets (RWA)

[![Built with Hedera](https://img.shields.io/badge/Built%20with-Hedera-00A0DC)](https://hedera.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)

---

## 📚 Table of Contents

1. [Hedera Network Integration](#hedera-network-integration)
2. [Architecture Overview](#architecture-overview)
3. [Transaction Types](#transaction-types)
4. [Economic Justification](#economic-justification)
5. [Deployment & Setup](#deployment--setup)
6. [Architecture Diagram](#architecture-diagram)
7. [Deployed Hedera IDs](#deployed-hedera-ids)
8. [Resources](#resources)

---

## 🌐 Hedera Network Integration

### Hedera Token Service (HTS)

**Why HTS for Property Tokenization?**
We chose Hedera Token Service (HTS) for fractionalizing real estate assets because its predictable $0.05 fee per token creation and $0.0001 per transfer operation guarantees operational cost stability, which is essential for enabling micro-investments starting from just $10 in Africa. Unlike Ethereum's volatile gas fees, Hedera's fixed costs ensure that property tokenization remains economically viable for both platform operations and investors.

**Implementation Details:**
- Each property receives a dedicated Treasury Account with unique ECDSA key pairs
- Fungible tokens created with 1:1 ratio to property value (e.g., $1M property = 1M tokens)
- Finite supply with maximum supply limits to prevent dilution
- NFT certificates for property ownership verification
- Token association required before transfers to ensure security

**Key Features:**
- **Token Minting**: Initial supply tied to property valuation
- **Token Transfer**: Atomic transfers from treasury to investors
- **Balance Tracking**: Real-time balance queries via Hedera Mirror Node
- **Supply Management**: Finite supply prevents infinite minting

---

### Hedera Consensus Service (HCS)

**Why HCS for Immutable Audit Trails?**
We chose HCS for immutable logging of critical property investment events because its predictable $0.0001 fee per message ensures complete transaction transparency without compromising operational margins. This is crucial for building trust in African real estate markets where fraud is widespread. HCS provides tamper-proof audit trails that cannot be disputed, giving investors confidence that their investments are recorded permanently on a distributed ledger.

**Implementation Details:**
- Each property has a dedicated HCS Topic for event logging
- Topics created with 3-month auto-renewal period
- All investment, transfer, and withdrawal events logged to HCS
- Mirror database provides fast querying while maintaining blockchain backup
- Topics are permissionless (anyone can submit) for maximum transparency

**Event Types Logged:**
- **Investment Events**: USD amount, HBAR equivalent, token quantity, investor account
- **Token Transfers**: From/to accounts, amounts, transaction IDs
- **Property Creation**: Initial listing, valuation, token symbol
- **Withdrawals**: Amount, reason, timestamp

---

### Hedera Accounts & HBAR Transfers

**Why Native HBAR for Payments?**
We leverage Hedera's native HBAR for payment processing because its deterministic fees and 3-5 second finality enable near-instant settlement at predictable costs. For African users accustomed to mobile money instant transfers, HBAR provides similar speed with blockchain-level security. Unlike traditional bank transfers that can take days and cost 5-6% in fees, Hedera transfers settle in seconds at $0.0001 per transaction.

**Implementation Details:**
- Easy account creation for new users with 20 HBAR funding
- ECDSA key pair generation for enhanced security
- HBAR-to-USD conversion using live pricing APIs
- Payment verification before token transfers
- Balance queries from Mirror Node for real-time updates

---

## 🏗️ Architecture Overview

### System Components

```
Frontend (Next.js 15)
├── React UI Components
├── Tailwind CSS Styling
├── Real-time Updates (Supabase)
└── Wallet Integration (HashPack)

Backend API (Next.js API Routes)
├── Property Management
├── Investment Processing
├── Marketplace Trading
├── Telegram/WhatsApp Bot
└── AI Valuation Service

Database (Supabase PostgreSQL)
├── User Profiles (KYC, wallets)
├── Properties (listings, status)
├── Treasury Accounts (Hedera IDs, keys)
├── Investments (transactions, status)
├── Property Events (mirrors HCS)
└── Marketplace Orders (buy/sell)

Hedera Network
├── Accounts (user wallets, treasuries)
├── HTS Tokens (fungible, NFTs)
├── HCS Topics (audit logs)
├── HBAR Transfers (payments)
└── Mirror Node (balance queries)
```

---

## 🔄 Transaction Types

### Core Hedera Transactions Used

| Transaction Type | Purpose | Fee | Usage |
|-----------------|---------|-----|-------|
| `AccountCreateTransaction` | Create treasury accounts for properties | $0.05 | 1 per property |
| `TokenCreateTransaction` | Create fungible tokens for fractionalization | $0.05 | 1 per property |
| `TokenMintTransaction` | Mint additional tokens (if needed) | $0.0001 | As needed |
| `TokenAssociateTransaction` | Associate tokens with user accounts | $0.0001 | 1 per user per property |
| `TransferTransaction` | Transfer HBAR or tokens | $0.0001 | Per payment/investment |
| `TopicCreateTransaction` | Create HCS topics for audit logs | $0.01 | 1 per property |
| `TopicMessageSubmitTransaction` | Log events to HCS | $0.0001 | Per investment/transfer |
| `AccountBalanceQuery` | Query account balances | FREE | Real-time tracking |

### Transaction Flow Example: Investment

```
1. Investor submits investment request
   └─> Backend fetches property details
   
2. Validate investor HBAR balance
   └─> AccountBalanceQuery (FREE)
   
3. Transfer HBAR payment
   └─> TransferTransaction ($0.0001)
   └─> Payment confirms in 3-5 seconds
   
4. Associate investor with property token
   └─> TokenAssociateTransaction ($0.0001)
   └─> One-time setup per property
   
5. Transfer tokens to investor
   └─> TransferTransaction ($0.0001)
   └─> Transfer confirms in 3-5 seconds
   
6. Log investment event
   └─> TopicMessageSubmitTransaction ($0.0001)
   └─> Immutable audit trail created
   
Total Cost: $0.0004 per investment
Total Time: 6-10 seconds
```

---

## 💰 Economic Justification

### Cost Analysis

**Traditional Real Estate Investment:**
- Broker fees: 5-6%
- Legal fees: 2-3%
- Administrative costs: 1-2%
- **Total: 8-11% of investment**

**Homebaise on Hedera:**
- Property tokenization: $0.05 one-time
- HBAR transfer: $0.0001
- Token transfer: $0.0001
- HCS logging: $0.0001
- Platform fee: 0.5%
- **Total: 0.5% + $0.0003 per investment**

**Savings: 8-10% reduction in fees**

### Throughput & Finality

- **Transactions per second:** 10,000+ TPS capacity
- **Finality time:** 3-5 seconds (ABFT consensus)
- **Settlement:** Instant and irreversible
- **Cost per transaction:** $0.0001 flat fee

### Africa-Specific Benefits

1. **Remittance Optimization**: $53B yearly remittances converted to investments
2. **Micro-Investments**: Start with $10 vs traditional $1,000+ minimums
3. **Mobile-First**: Telegram/WhatsApp integration for no-app access
4. **Predictable Costs**: Fixed fees eliminate surprise charges
5. **Diaspora Access**: Global investors can buy African real estate 24/7

---

## 🚀 Deployment & Setup

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (or PostgreSQL database)
- Hedera Testnet account with HBAR
- Pinata account for IPFS (optional)

### Step-by-Step Installation

#### 1. Clone Repository

```bash
git clone https://github.com/successaje/Homebaise.git
cd homebaise
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Hedera Testnet Configuration
NEXT_PUBLIC_MY_ACCOUNT_ID=0.0.xxxxx
NEXT_PUBLIC_MY_PRIVATE_KEY=302e020100300506032b657004220420...

# Pinata Configuration (for IPFS)
NEXT_PUBLIC_PINATA_JWT_TOKEN=your_pinata_jwt_token

# Bot Configuration (optional)
BOT_SERVER_TOKEN=your_bot_token
BOT_SKIP_DB=false

# Hedera Network
NEXT_PUBLIC_HEDERA_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com
```

#### 4. Set Up Database

```bash
# Run migrations
cd supabase
psql $DATABASE_URL < migrations/20241220000001_create_tables.sql
psql $DATABASE_URL < migrations/20241220000002_add_hcs_integration.sql
# ... run all migrations in order
```

#### 5. Fund Hedera Account

```bash
# Visit Hedera Testnet Faucet
# https://portal.hedera.com/register

# Fund your operator account with at least 100 HBAR
# for treasury account creation and token operations
```

#### 6. Run Development Server

```bash
npm run dev
```

### Running Environment

**Frontend:** 
- Navigate to `http://localhost:3000`
- Next.js development server running on port 3000

**API Endpoints:**
- Available at `http://localhost:3000/api/*`
- RESTful API for all operations

**Database:**
- Supabase PostgreSQL instance
- Real-time subscriptions enabled
- Row Level Security (RLS) active

**Bot Server (optional):**
```bash
cd bot
npm install
npm run dev
# Server running on configured port
```

**Try the Live Bot:**
- 🤖 **Telegram Bot**: [@homebaise_bot](https://t.me/homebaise_bot)
- Invest in real estate through natural language commands
- No app download required

---

## 📊 Architecture Diagram

![Homebaise Architecture Flowchart](public/images/flowchart.png)

### Detailed Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOMEBAISE PLATFORM                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Next.js    │  │   React     │  │   Tailwind  │              │
│  │   (Port     │  │ Components  │  │     CSS     │              │
│  │   3000)     │  │             │  │             │              │
│  └─────┬───────┘  └──────┬──────┘  └──────┬──────┘              │
└────────┼──────────────────┼─────────────────┼────────────────────┘
         │                  │                 │
         ▼                  ▼                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                         API LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Property    │  │ Investment  │  │ Marketplace │              │
│  │  API        │  │    API      │  │     API     │              │
│  └─────┬───────┘  └──────┬──────┘  └──────┬──────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │    Bot      │  │    AI       │  │ Certificate │              │
│  │    API      │  │ Valuation   │  │     API     │              │
│  └─────┬───────┘  └──────┬──────┘  └──────┬──────┘              │
└────────┼──────────────────┼─────────────────┼────────────────────┘
         │                  │                 │
         ▼                  ▼                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Supabase   │  │  Profiles   │  │ Properties  │              │
│  │ PostgreSQL  │  │   Users     │  │  Treasury   │              │
│  └─────┬───────┘  └──────┬──────┘  └──────┬──────┘              │
└────────┼──────────────────┼─────────────────┼────────────────────┘
         │                  │                 │
         └──────────────────┴─────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      HEDERA NETWORK                               │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              HEDERA CONSENSUS LAYER                        │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐           │ │
│  │  │   Node 1   │  │   Node 2   │  │   Node N   │           │ │
│  │  │  (3-5 sec  │  │  (ABFT     │  │  (Finality │           │ │
│  │  │  finality) │  │  consensus)│  │  verified) │           │ │
│  │  └────────────┘  └────────────┘  └────────────┘           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              HEDERA SERVICES                               │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ HTS          │  │ HCS          │  │ Accounts     │    │ │
│  │  │ (Tokens)     │  │ (Topics)     │  │ (HBAR)       │    │ │
│  │  │ $0.05/$0.0001│  │ $0.01/$0.0001│  │ $0.0001     │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           MIRROR NODE                                      │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Balance Queries | Transaction History              │  │ │
│  │  │  Token Info | Account Info (FREE)                   │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘

DATA FLOW FOR INVESTMENT:

User → Frontend → API → Database ← Query
                               ↓
                         Create Investment
                               ↓
                       ┌───────┴────────┐
                       │                │
              HTS Transfer      HCS Logging
                       │                │
              ┌────────┘                └────────┐
              ↓                                  ↓
    TokenCreateTransaction          TopicMessageSubmitTransaction
    TransferTransaction             (Immutable Audit Trail)
              │                                  │
              └────────────────┬─────────────────┘
                               ↓
                    Mirror Node Indexing
                               ↓
                    Update Database + UI
```

---

## 🔑 Deployed Hedera IDs

### Testnet Deployment

**Operator Account (Platform):**
- Account ID: `[YOUR_ACCOUNT_ID]`
- Purpose: Creates treasury accounts and issues tokens

**Property Treasury Accounts:**
- Each property has a unique treasury account
- Format: `0.0.XXXXX`
- Stored in `property_treasury_accounts` table

**HTS Token IDs (Fungible):**
- One per tokenized property
- Format: `0.0.XXXXX`
- Stored with property records

**HCS Topic IDs:**
- One per property for event logging
- Format: `0.0.XXXXX`
- Stored in `property_treasury_accounts.topic_id`

**NFT Certificate IDs:**
- Created for ownership certificates
- Format: `0.0.XXXXX`
- Stored in user certificates

### Production IDs (Coming Soon)

Details will be added after mainnet deployment.

---

## 📖 Additional Resources

### Documentation

- [Property Tokenization README](docs/PROPERTY_TOKENIZATION_README.md)
- [Secondary Marketplace Documentation](docs/SECONDARY_MARKETPLACE_README.md)
- [AI Valuation System](docs/AI_VALUATION_SYSTEM.md)
- [Features Overview](docs/FEATURES_OVERVIEW.md)

### Certificates & Pitch

- **Certificate**: [View Certificate](cert/886eb452-88f0-489e-9772-b9605d6ba2ae.pdf)
- **Pitch Video**: [Watch on YouTube](https://youtu.be/YH5-hDscbrM)
- **Presentation Slides**: [Download PDF](homebaise.pdf)

### External Links

- [Hedera Documentation](https://docs.hedera.com)
- [HashScan Explorer](https://hashscan.io/testnet)
- [Hedera Mirror Node API](https://docs.hedera.com/hedera/api/mirror-node-api)
- [Next.js Documentation](https://nextjs.org/docs)

### Telegram Bot Architecture (Updated)

- **Onboarding pipeline**: `/start` collects the user’s phone number, branches into *existing account* (email lookup + phone sync) or *new account* (optional email), then issues OTP via Supabase and stores the session in `bot_sessions`.
- **Exploration menus**: Inline keyboards expose curated *property*, *agriculture*, and *community* listings seeded from `bot/src/data/listings.ts`; each card caches metadata for quick investing.
- **Investment execution**: Primary path hits `/api/bot/invest` with `X-Bot-Token`; if the endpoint isn’t deployed the bot falls back to a simulated transaction ID (`SIM-*`) so conversational flows remain demo-friendly. Successful investments are logged in-memory for the “My Investments” tracker.
- **Portfolio APIs**: `/api/bot/portfolio` returns the aggregated Supabase view using the service-role key, allowing the bot to surface totals and holdings without user cookies.
- **Listing creation**: Telegram users can create property/agriculture/community listings via a multi-step flow. Listings are cached in-memory and merged with curated data for quick iteration during demos.
- **Marketplace & token desk**: Secondary market, primary issues, and token pairs are exposed through static datasets and rendered via inline keyboards for real-time context.
- **Developer following**: Users can follow/unfollow developer profiles; the bot persists selections in-memory and updates inline buttons statefully.
- **Notification controls**: `get_or_create_notification_preferences` RPC keeps alert switches in sync, while `/notify` webhooks bridge the Next.js app to the running bot process.

### Live Demo

- 🤖 **Telegram Bot**: [Try @homebaise_bot](https://t.me/homebaise_bot) - Invest via natural language

### Support

- Issues: [GitHub Issues](https://github.com/successaje/Homebaise/issues)
- Discussions: [GitHub Discussions](https://github.com/successaje/Homebaise/discussions)

---

## 🤖 AI & Machine Learning Stack

### Current Implementation: Ollama + DeepSeek

Homebaise uses **Ollama** (local AI inference server) with the **DeepSeek Coder** model for property valuation and risk analysis.

**Why Ollama + DeepSeek?**
- **Cost-effective**: No API costs for inference
- **Privacy-first**: Property data remains on-premises
- **High performance**: Fast inference (3-5 seconds)
- **DeepSeek Coder**: Specialized in structured JSON responses for property analysis

**Configuration:**
```env
OLLAMA_URL=http://localhost:11434
```

**Usage:**
- Property valuation with confidence scores
- Multi-factor risk assessment
- Market analysis and growth potential
- Investment recommendations
- Real-time analysis via `/api/ai/valuation`

### Future Enhancements

#### ElizaOS Integration (Planned)

**ElizaOS** integration will enable intelligent agent-based workflows:

- **Natural Language Processing**: Users can interact in plain English ("Invest $500 in Lagos property")
- **Multi-Agent Workflows**: Specialized AI agents for:
  - Property valuation
  - Investment analysis
  - Portfolio management
  - Risk assessment
- **Intelligent Transaction Execution**: AI agents that understand intent and execute Hedera transactions
- **Conversational Bots**: Enhanced Telegram/WhatsApp bot with AI understanding

#### Native Hedera Plugin for Homebaise (Planned)

A **native Hedera plugin** will simplify transaction execution:

**Features:**
- **One-Line Commands**: Complex Hedera operations simplified
- **Property Token Operations**: Create, transfer, and manage tokens easily
- **Treasury Management**: Automated treasury account operations
- **HCS Integration**: Seamless event logging and audit trails
- **Plugin Marketplace**: Shareable plugins for common workflows

**Example Usage:**
```typescript
// Future plugin API
const homebaise = new HomebaiseHederaPlugin();

// Simple investment
await homebaise.invest(propertyId, amount, userId);
// Automatically handles: HBAR transfer → Token association → Token transfer → HCS logging

// Property tokenization
await homebaise.tokenizeProperty(propertyId, initialSupply);
// Creates treasury → Mints tokens → Sets up HCS topic
```

**Benefits:**
- **Developer Experience**: Reduced boilerplate code
- **Error Handling**: Built-in transaction retries and error recovery
- **Cost Optimization**: Automatic fee estimation and optimization
- **Composability**: Plugins work together seamlessly
- **Community**: Shareable Hedera workflows for RWA projects

---

## 🎯 Key Features Summary

✅ **Property Tokenization** - Fractionalize real estate into digital shares  
✅ **Micro-Investments** - Start investing from $10  
✅ **Secondary Marketplace** - Trade property tokens 24/7  
✅ **AI Valuation** - Automated property price analysis  
✅ **Bot Integration** - Invest via Telegram/WhatsApp  
✅ **NFT Certificates** - Proof of ownership on-chain  
✅ **Immutable Audit Trail** - All transactions logged to HCS  
✅ **KYC Integration** - Compliant investor onboarding  
✅ **Mobile-First Design** - Responsive UI for all devices  

---

**Built with ❤️ for Africa on Hedera Network**

