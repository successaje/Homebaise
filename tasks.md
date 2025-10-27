# 🎯 Goal

Build a demo dApp for the Hedera hackathon that demonstrates:
- Transparent, onchain land/property/farm registry
- Fractional ownership & investment (micro-investments)
- Diaspora remittance-to-investment flows
- Farmer financing (tokenized crops, collateral-based loans)
- Secure, trust-minimized transactions using Hedera
- Portfolio dashboard & yield distribution

---

## 🛠️ Setup
- Initialize Next.js project (`create-next-app@latest`)
- Add TailwindCSS for styling
- Install Hedera SDK + wallet integration tools:
  - `@hashgraph/sdk`
  - `hashconnect`
- Setup GitHub repo + project board

---

## MVP & Demo-Critical Flows
- [ ] User connects wallet (HashPack via HashConnect)
- [ ] User browses tokenized properties/farms (Onchain Registry)
- [ ] User can view property details and breakdown of ownership tokens
- [ ] User purchases fractional ownership (Micro-Investments)
- [ ] Diaspora remittance flow: send → invest
- [ ] Portfolio dashboard: see owned tokens, % ownership, and mock yield
- [ ] Claim/receive yield (mock payout)

---

## 🔑 Core Features
- **Onchain Land/Asset Registry**
  - Smart contract or mock backend for land/property/farm tokenization
  - Transparent listing of assets (fraud-proof, tamper-proof)
- **Diaspora Gateway**
  - Simulate remittance input (USD → HBAR → asset)
  - Auto-invest remittance into property tokens
- **Micro-Investments**
  - Fractional purchase flow (as little as $10)
  - Confirmation and transaction feedback
- **Farmer Financing**
  - (Stretch) Tokenized crops/loans for farmers
- **Trust Layer**
  - Use Hedera DLT for all asset/token operations
  - Display audit/logs for transparency
- **Portfolio & Yield**
  - User dashboard with all owned assets
  - Simulated yield distribution and claim

---

## 🏗️ UI/UX Polish
- Landing Page: explain Homebaise, problem, solution
- Navbar + footer with links
- Responsive design (mobile-first)
- Demo/test property images

---

## 📹 Demo Prep
- Seed with 2–3 sample properties (mock JSON or contract)
- Test user flow: connect wallet → browse → buy fraction → dashboard → claim yield
- Record walkthrough video (screen capture)

---

## 🧩 Stretch Features (if time allows)
- Group pooling (multiple users co-invest in 1 property)
- KYC mock (upload ID, no backend)
- Real stablecoin integration (`USDC` on Hedera testnet)
- Interactive map view of properties
- Farmer financing (tokenized crops/loans)


## 💳 Purchase Flow
- When user clicks **Buy Fraction**:
  - Trigger Hedera token transfer (mock/testnet)
  - Show confirmation modal
  - Update user dashboard after purchase

---

## 📊 Dashboard
- Create **Portfolio Dashboard**:
  - Show all properties user owns fractions of
  - Show ownership percentage
  - Show expected yield/rewards (mock values)

---

## 🌍 Remittance Simulation
- Create simple **Send → Invest** flow:
  - User inputs USD amount (simulated remittance)
  - Convert to HBAR (mock conversion rate)
  - Auto-purchase property tokens with equivalent value
  - Show confirmation: “Your remittance has been invested into Property X.”

---

## 💸 Yield Distribution (Mock)
- Add simple **Rewards Page**:
  - Show monthly payout simulation (e.g. 5 HBAR distributed to token holders)
  - Allow user to **Claim Rewards** (trigger token transfer from test contract)

---

## 🎨 UI/UX Polish
- Landing Page: explain what Homebaise is (problem + solution)
- Navbar + footer with links
- Responsive design (mobile-first)
- Add demo/test property images

---

## 📹 Demo Prep
- Seed project with 2–3 sample properties (mock JSON file)
- Create test user flow:
  - Connect wallet → browse properties → buy fraction → see dashboard → claim yield
- Record walkthrough video (screen capture)

---

## 🧩 Stretch Features (if time allows)
- Group pooling (multiple users co-invest into 1 property)
- KYC mock (upload ID, no backend)
- Real stablecoin integration (`USDC` on Hedera testnet)
- Interactive map view of properties


---
## Additional ones 
- Remmitance and Yield
- Agriculture and from produce inclusive
- Interoperability of networks and chain.
