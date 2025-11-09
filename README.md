# Homebaise

> **Tagline:** “Own, invest, and build trust in Africa — one block at a time.”

**🏆 Hackathon Track:** Onchain Finance & Real-World Assets (RWA)

### Quick Links

- 📖 **[Technical Documentation](TECHNICAL_DOCUMENTATION.md)** - Complete architecture and setup guide
- 📄 **[Certificate](cert/886eb452-88f0-489e-9772-b9605d6ba2ae.pdf)** - Project certification
- 🎬 **[Pitch Video](https://youtu.be/YH5-hDscbrM)** - Watch our pitch video
- 📊 **[Presentation Slides](homebaise.pdf)** - Download Pitch deck
- 🤖 **[Try the Bot](https://t.me/homebaise_bot)** - Invest via Telegram


---

## 🚩 Problem
Millions of Nigerians & Africans struggle with land fraud, missing property records, and lack of access to safe investments.

- Diaspora remittances ($53B into Africa yearly) mostly go into consumption, not wealth-building assets.
- Farmers and property owners can’t unlock liquidity from their assets.

---

## 💡 Solution (Homebaise)
A Hedera-powered RWA platform that:
- Tokenizes land, property & farms into secure digital shares.
- Enables fractional ownership & investment — start with as little as $10.
- Connects diaspora remittances directly into real assets back home.
- Provides yield & liquidity through property rentals or crop revenue sharing.

---

## 🔑 Features
- 📜 **Onchain Land Registry:** Transparent, tamper-proof, fraud-proof
- 🌍 **Diaspora Gateway:** Send remittances as investments, not just cash
- 💸 **Micro-Investments:** Buy fractions of real estate or farmland
- 🌱 **Farmer Financing:** Tokenized crops & collateral-based loans
- 🔒 **Trust Layer:** Hedera's DLT ensures fairness, speed & low costs

---

## 🚀 Planned Features: Property Token Collateralization

### Using Homebaise Property Tokens as Collateral

Once properties are tokenized via the Hedera Token Service (HTS), each token represents a verified, on-chain share of real estate value. That means those tokens can serve as backed digital assets and be used as collateral for loans or credit within the ecosystem.

### 💡 Possible Implementations

**DeFi Collateralization Layer**
- Integrate with lending protocols (like Aave or HBAR-native protocols such as SaucerSwap or Heliswap extensions)
- Users can stake their property tokens (e.g., ZOVT) as collateral
- They receive stablecoins, HBAR, or Homebaise credits in return — all managed via smart contracts

**Peer-to-Peer Lending (P2P)**
- Token holders can offer their tokens as collateral for community-driven loans
- The loan agreement is recorded on Hedera Consensus Service (HCS) for transparency
- If repayment fails, the tokenized property shares are automatically transferred to the lender

**Real Estate Credit Scores (AI + Onchain)**
- Homebaise AI can assess risk and yield potential of collateralized assets
- Users with a strong investment track record and verified identity get better credit terms
- This creates a trustless property credit market

**Stablecoin-Backed Loans**
- Borrow against your property tokens in stable assets (e.g., USDC, HUSD, or future Homebaise-stable)
- Useful for developers or investors who want liquidity without selling their property shares

### 🌟 Why It's a Big Deal

- **Unlocks liquidity** from traditionally illiquid real estate assets
- **Bridges DeFi + Real Estate**, enabling real yield backed by real assets
- **Empowers African investors** to access credit using verifiable, tokenized property holdings — not just fiat collateral
- **Creates a sustainable DeFi loop** around property ownership, income, and lending

### 🔮 Impact on Web3 & Hedera

This feature positions Homebaise as a bridge between traditional real estate and decentralized finance, showcasing how **Real-World Assets (RWA)** can unlock new financial primitives on Hedera:

- **Demonstrates RWA utility beyond simple tokenization** — tokens become functional financial instruments
- **Showcases Hedera's capabilities** for DeFi use cases with predictable fees and fast finality
- **Creates network effects** — more property tokens = more collateral = more liquidity in the ecosystem
- **Opens new revenue streams** for token holders without selling their property shares
- **Sets a precedent** for other RWA projects on Hedera to follow

---

## 🌍 Impact
- Nigerians/Africans get trustworthy land ownership & accessible investments.
- Diaspora Africans build generational wealth, not just spend.
- Farmers gain capital & fairer markets.
- Hedera becomes the backbone of African real-world assets.

---

## 👥 Team

**Aje Success** — *Founder & Fullstack Developer*  
Founder of Homebaise. Experienced in building full-stack blockchain solutions and connecting real-world communities in Africa.  
Co-founded **GameBloc**, which partnered with the **African BR Gaming Community** to run multiple tournaments across the continent.

**Olaoye Trust Victor** — *Realtor & Real Estate Consultant*  
Brings hands-on experience from the African property market, providing strategic insights into real estate valuation and investor relations.

**Boyrn** — *Social Media & Technical Writer*  
Drives Homebaise's public voice and community presence through content, storytelling, and educational outreach.

**Nailer** — *Developer & Contributor*  
Supports the technical implementation, feature integration, and on-chain optimizations for the Homebaise platform.

**Core technical build and Hedera integration were executed by Aje Success, with advisory and content support from other members.**

---

## 🎯 Hackathon Pitch One-Liner
> "Homebaise is where Africa's assets meet Web3 — turning land, farms, and homes into trusted, investable opportunities on Hedera."

---

## 📊 System Architecture

![Homebaise Architecture Flowchart](public/images/flowchart.png)

---
## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/successaje/Homebaise.git
cd homebaise

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 🔐 Credentials Access

To ensure the privacy and security of Hedera and Telegram credentials, all sensitive test keys are securely stored in a private Google Doc.

Judges or reviewers can request access here:  
👉 [Request Access to Secure Test Credentials](https://docs.google.com/document/d/11j2yGlSbAZubb9lusbA2W0jMZSgccJLnVcjjLa7L8hE/edit?usp=sharing)

> Access will be granted to verified hackathon judges upon request.


---

## 🤖 Telegram Bot

Our Telegram bot makes it easy to manage your Homebaise portfolio without opening the web app:

- **Guided onboarding:** Share your phone number, choose whether you already have an account or want to create one, and verify with OTP in-chat. Existing users can link by email; new users can provide an optional email on the fly.
- **Interactive dashboard:** The in-bot menu covers balance checks, recent activity, notification preferences, marketplace movements, and token desk stats in a few taps.
- **Investment exploration:** Browse curated property, agricultural, and community listings, complete with instant “Invest” buttons, detailed views, and quick-amount shortcuts.
- **Create & publish listings:** Community members can draft new opportunities (property, farm, community) directly in Telegram—perfect for hackathon demos and rapid prototyping.
- **Marketplace & trading desk:** Review primary/secondary listings, monitor token pairs, and stay ahead of price movements without leaving the conversation.
- **Relationship tools:** Follow developers, track your personal investments, and receive inline notifications for yields, milestones, and funding progress.

You can explore every bot feature with live data using the same credentials as the web platform.

---

### Live Hedera Treasury Accounts & Tokens

Real testnet accounts powering Homebaise properties (open in Hashscan for on-chain details):

- `0.0.7161917` (Property `4595715a-5347-49e7-83be-103e28b31a05`) — Token `0.0.7161922` *(FUNGIBLE, balance ≈ 11,999,985)*  
  [Account](https://hashscan.io/testnet/account/0.0.7161917) • [Token](https://hashscan.io/testnet/token/0.0.7161922)
- `0.0.6752493` (Property `23eea399-2baf-4521-b58c-c28be620d0b5`) — Token `0.0.6752494` *(FUNGIBLE, balance ≈ 2,999,990)*  
  [Account](https://hashscan.io/testnet/account/0.0.6752493) • [Token](https://hashscan.io/testnet/token/0.0.6752494)
- `0.0.7159706` (Property `a0b274d5-27e9-42f6-a505-6d1a28bfb976`) — Token `0.0.7159708` *(FUNGIBLE, balance ≈ 419,950)*  
  [Account](https://hashscan.io/testnet/account/0.0.7159706) • [Token](https://hashscan.io/testnet/token/0.0.7159708)
- `0.0.7162090` (Property `05d4a6af-0f92-4453-ab5e-0eabeac48700`) — Token `0.0.7162093` *(FUNGIBLE, balance ≈ 3,799,950)*  
  [Account](https://hashscan.io/testnet/account/0.0.7162090) • [Token](https://hashscan.io/testnet/token/0.0.7162093)
- `0.0.7159657` (Property `1aab2fbb-94b3-45f5-a056-f08390cbf793`) — Token `0.0.7159659` *(FUNGIBLE, balance ≈ 7,499,970)*  
  [Account](https://hashscan.io/testnet/account/0.0.7159657) • [Token](https://hashscan.io/testnet/token/0.0.7159659)
- `0.0.6753839` (Property `7cd1a7b6-69a3-47d2-aab8-d6690b230ef1`) — Token `0.0.6753840` *(FUNGIBLE, balance ≈ 4,999,990)*  
  [Account](https://hashscan.io/testnet/account/0.0.6753839) • [Token](https://hashscan.io/testnet/token/0.0.6753840)
- `0.0.6754817` (Property `cfe8a139-3361-4b39-825d-bb624d7a5a86`) — Token `0.0.6754818` *(FUNGIBLE, balance ≈ 4,000,000)*  
  [Account](https://hashscan.io/testnet/account/0.0.6754817) • [Token](https://hashscan.io/testnet/token/0.0.6754818)

---

## 📖 Documentation

- [Technical Documentation](TECHNICAL_DOCUMENTATION.md) - Hedera integration, architecture, deployment
- [Property Tokenization](docs/PROPERTY_TOKENIZATION_README.md) - Tokenization workflow
- [Secondary Marketplace](docs/SECONDARY_MARKETPLACE_README.md) - Trading platform
- [AI Valuation System](docs/AI_VALUATION_SYSTEM.md) - Automated property analysis

---

## 🌐 Hedera Network

This project is built on **Hedera Hashgraph** with:

- **Hedera Token Service (HTS)** - Property fractionalization
- **Hedera Consensus Service (HCS)** - Immutable audit trails
- **Native HBAR** - Payment processing
- **Mirror Node** - Real-time balance queries

### Hedera Service Code (GitHub)

- [src/lib/hedera.ts](https://github.com/successaje/Homebaise/blob/main/src/lib/hedera.ts) — core helpers for creating accounts, minting HTS tokens (fungible & NFT), querying balances, and sending HBAR.
- [src/lib/hedera-treasury.ts](https://github.com/successaje/Homebaise/blob/main/src/lib/hedera-treasury.ts) — treasury account orchestration, token associations, mint/distribution utilities used by property flows.
- [src/app/api/bot/transfer/route.ts](https://github.com/successaje/Homebaise/blob/main/src/app/api/bot/transfer/route.ts) — secure service-role endpoint the Telegram bot calls to execute HBAR transfers between investors.
- [src/app/api/bot/invest/route.ts](https://github.com/successaje/Homebaise/blob/main/src/app/api/bot/invest/route.ts) — bot-enabled investment flow that resolves property tokens and executes on-chain transfers.
- [src/app/api/bot/portfolio/route.ts](https://github.com/successaje/Homebaise/blob/main/src/app/api/bot/portfolio/route.ts) — service-role Supabase view exposing token balances & earnings for bot users.

**Account provisioning (20 HBAR bootstrap + mirror-node confirmation)**

```ts 17:70:src/lib/hedera.ts 
export async function createHederaAccount(): Promise<HederaAccountResult> {
  const operatorId = process.env.MY_ACCOUNT_ID || process.env.NEXT_PUBLIC_MY_ACCOUNT_ID;
  const operatorKey = process.env.MY_PRIVATE_KEY || process.env.NEXT_PUBLIC_MY_PRIVATE_KEY;
  if (!operatorId || !operatorKey) {
    throw new Error('Hedera operator credentials not found in environment variables');
  }

  const client = Client.forTestnet().setOperator(operatorId, operatorKey);
  const newPrivateKey = PrivateKey.generateECDSA();
  const transaction = new AccountCreateTransaction()
    .setKey(newPrivateKey.publicKey)
    .setInitialBalance(new Hbar(20));

  const receipt = await (await transaction.execute(client)).getReceipt(client);
  const newAccountId = receipt.accountId;
  if (!newAccountId) throw new Error('Failed to create Hedera account');

  await new Promise(resolve => setTimeout(resolve, 6000));
  const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/balances?account.id=${newAccountId}`;
  const data = await (await fetch(mirrorNodeUrl)).json();

  const balanceInHbar =
    data.balances && data.balances.length > 0
      ? data.balances[0].balance / 100000000
      : 20;

  client.close();
  return {
    accountId: newAccountId.toString(),
    evmAddress: `0x${newPrivateKey.publicKey.toEvmAddress()}`,
    privateKey: newPrivateKey.toString(),
    publicKey: newPrivateKey.publicKey.toString(),
    balance: balanceInHbar
  };
}
```

**Property treasury bootstrap (new account + finite HTS supply)**

```ts 50:136:src/lib/hedera-treasury.ts
export async function createPropertyTreasuryAccount(
  client: Client,
  initialBalance: Hbar = new Hbar(20)
): Promise<TreasuryAccount> {
  const privateKey = PrivateKey.generateECDSA();
  const transaction = new AccountCreateTransaction()
    .setECDSAKeyWithAlias(privateKey)
    .setInitialBalance(new Hbar(20))
    .setAccountMemo("A Property Treasury Account");

  const receipt = await (await transaction.execute(client)).getReceipt(client);
  const accountId = receipt.accountId;
  if (!accountId) throw new Error("Failed to get account ID from receipt");

  return {
    accountId: accountId.toString(),
    publicKey: privateKey.publicKey.toString(),
    privateKey: privateKey.toString(),
    initialBalance
  };
}

export async function createPropertyToken(
  client: Client,
  metadata: TokenMetadata,
  treasuryPrivateKey: string
): Promise<MintedToken> {
  const transaction = new TokenCreateTransaction()
    .setTokenName(metadata.name)
    .setTokenSymbol(metadata.symbol)
    .setInitialSupply(metadata.initialSupply)
    .setTreasuryAccountId(AccountId.fromString(metadata.treasuryAccountId))
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(metadata.maxSupply)
    .setTokenType(TokenType.FungibleCommon)
    .setTokenMemo(`Homebaise | ${metadata.name} | Tokenized RE | ...`)
    .setMaxTransactionFee(new Hbar(5));

  const signedTx = await (await transaction.freezeWith(client))
    .sign(PrivateKey.fromString(treasuryPrivateKey));

  const receipt = await (await signedTx.execute(client)).getReceipt(client);
  const tokenId = receipt.tokenId;
  if (!tokenId) throw new Error("Failed to get token ID from receipt");

  return {
    tokenId: tokenId.toString(),
    tokenName: metadata.name,
    tokenSymbol: metadata.symbol,
    totalSupply: metadata.initialSupply.toString(),
    treasuryAccountId: metadata.treasuryAccountId
  };
}
```

**HBAR transfer primitive (wrapped with Hashscan logging)**

```ts 283:333:src/lib/hedera.ts
export async function sendHbar(input: SendHbarInput): Promise<SendHbarResult> {
  const { senderAccountId, senderPrivateKey, receiverAccountId, amount, memo } = input;
  if (!senderAccountId || !senderPrivateKey || !receiverAccountId || amount <= 0) {
    throw new Error('Invalid input parameters for HBAR transfer');
  }

  const client = Client.forTestnet().setOperator(senderAccountId, senderPrivateKey);
  const txTransfer = new TransferTransaction()
    .addHbarTransfer(AccountId.fromString(senderAccountId), new Hbar(-amount))
    .addHbarTransfer(AccountId.fromString(receiverAccountId), new Hbar(amount));
  if (memo) {
    txTransfer.setTransactionMemo(memo);
  }

  const txTransferResponse = await txTransfer.execute(client);
  const receiptTransferTx = await txTransferResponse.getReceipt(client);
  const txIdTransfer = txTransferResponse.transactionId.toString();
  const hashscanUrl = `https://hashscan.io/testnet/transaction/${txIdTransfer}`;

  client.close();
  return {
    transactionId: txIdTransfer,
    status: receiptTransferTx.status.toString(),
    hashscanUrl
  };
}
```

**Telegram bridge (auto-provision recipient, transfer, persist Supabase state)**

```ts 35:149:src/app/api/bot/transfer/route.ts
export async function POST(request: NextRequest) {
  const token = request.headers.get('x-bot-token') || request.headers.get('X-Bot-Token');
  if (!token || token !== process.env.BOT_SERVER_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as TransferBody;
  const rawAmount = Number(body.amount);
  if (!body.senderId || !Number.isFinite(rawAmount) || rawAmount <= 0) {
    return NextResponse.json({ error: 'Invalid sender or amount' }, { status: 400 });
  }
  if (!body.recipientPhone && !body.recipientAccountId) {
    return NextResponse.json({ error: 'Recipient required (phone or accountId)' }, { status: 400 });
  }

  const { data: sender } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, phone_number, hedera_account_id, hedera_private_key')
    .eq('id', body.senderId)
    .maybeSingle();
  if (!sender?.hedera_account_id || !sender.hedera_private_key) {
    return NextResponse.json({ error: 'Sender does not have a Hedera account linked' }, { status: 400 });
  }

  let receiverAccountId: string | null = null;
  if (body.recipientAccountId) {
    receiverAccountId = body.recipientAccountId.trim();
  } else if (body.recipientPhone) {
    const normalizedPhone = normalizePhone(body.recipientPhone);
    const { data: recipient } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, phone_number, hedera_account_id, hedera_private_key, hedera_public_key')
      .eq('phone_number', normalizedPhone)
      .maybeSingle();
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    if (isHederaAccountId(recipient.hedera_account_id)) {
      receiverAccountId = recipient.hedera_account_id.trim();
    } else {
      const newAccount = await createHederaAccount();
      receiverAccountId = newAccount.accountId;
      await supabaseAdmin.from('profiles')
        .update({
          hedera_account_id: newAccount.accountId,
          hedera_private_key: newAccount.privateKey,
          hedera_public_key: newAccount.publicKey,
          wallet_address: newAccount.accountId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recipient.id);
    }
  }

  const memo = body.memo?.slice(0, 90) ||
    `Telegram transfer from ${sender.full_name || sender.email || 'Homebaise user'}`;

  const transferResult = await sendHbar({
    senderAccountId: sender.hedera_account_id,
    senderPrivateKey: sender.hedera_private_key,
    receiverAccountId: receiverAccountId!,
    amount: Number(rawAmount.toFixed(8)),
    memo,
  });

  return NextResponse.json({
    success: true,
    transactionId: transferResult.transactionId,
    status: transferResult.status,
    hashscanUrl: transferResult.hashscanUrl,
    receiverAccountId,
  });
}
```

**Transaction Costs:**
- Token creation: $0.05
- Token transfer: $0.0001
- HBAR transfer: $0.0001
- HCS message: $0.0001

---

## 📄 License
MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

Built with support from the Hedera ecosystem and the African real estate community.

