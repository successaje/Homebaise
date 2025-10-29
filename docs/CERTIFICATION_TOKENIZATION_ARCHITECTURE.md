# Property Certification & Tokenization Architecture

## Overview

This document outlines the revised architecture that properly separates **Property Certification** (verification NFTs) from **Property Tokenization** (fungible tokens for trading).

## Architecture Principles

### 1. **Certification System** (Verification NFTs)
- **Purpose**: Verify that a property meets platform standards and compliance requirements
- **Implementation**: Uses a **pre-deployed NFT contract** (`0.0.6755654` by default)
- **Process**: Mints new NFT from existing contract for each property verification
- **Status**: Property becomes `certified` (not `tokenized`)
- **Data Storage**: `property_certificates` table with `certificate_token_id`

### 2. **Tokenization System** (Fungible Tokens)
- **Purpose**: Create tradeable fractional ownership tokens
- **Implementation**: Creates **new fungible token contract** for each property
- **Process**: Creates treasury account + fungible token for fractional ownership
- **Status**: Property becomes `tokenized` (separate from `certified`)
- **Data Storage**: `property_treasury_accounts` table with `token_id`

## Property States & Workflow

```
draft → pending → approved → certified → tokenized
```

### State Definitions:
- **`draft`**: Property is being prepared by owner
- **`pending`**: Property submitted for review
- **`approved`**: Property approved by admin (ready for certification)
- **`certified`**: Property verified with NFT certificate (ready for tokenization)
- **`tokenized`**: Property has fungible tokens for trading

### Key Rules:
1. A property can be **certified** (verified) but not **tokenized** (tradeable)
2. A property should be **certified** before **tokenization**
3. Certification and tokenization are **independent processes**

## Technical Implementation

### Certification Process

#### 1. Certificate Generation (`/api/generate-certificate`)
```typescript
// Verification data structure
const verificationData = {
  kycVerified: boolean,
  legalDocsValidated: boolean,
  ownershipConfirmed: boolean
};

// Uses pre-deployed contract
const result = await mintCertificateNFT({
  tokenName: `Property Certificate - ${property.name}`,
  tokenSymbol: 'PROPCERT',
  metadataUrl: metadataUrl
});
```

#### 2. Database Updates
```sql
-- Update property status
UPDATE properties SET 
  status = 'certified',
  certificate_token_id = '0.0.6755654',
  certificate_id = certificate_record_id
WHERE id = property_id;

-- Create certificate record
INSERT INTO property_certificates (
  property_id, certificate_hash, nft_token_id, 
  status, ipfs_metadata_url
) VALUES (...);
```

### Tokenization Process

#### 1. Tokenization (`/api/tokenize-property`)
```typescript
// Requires certification first
if (property?.status !== 'certified' && !property?.certificate_token_id) {
  throw new Error('Property must be certified before tokenization');
}

// Create new fungible token
const tokenResult = await createPropertyToken(client, metadata, treasuryPrivateKey);
```

#### 2. Database Updates
```sql
-- Update property status
UPDATE properties SET 
  status = 'tokenized',
  token_id = fungible_token_id
WHERE id = property_id;

-- Create treasury account record
INSERT INTO property_treasury_accounts (
  property_id, hedera_account_id, token_id,
  status
) VALUES (...);
```

## Database Schema

### Properties Table
```sql
-- Certificate fields
certificate_id UUID REFERENCES property_certificates(id)
certificate_token_id TEXT -- NFT contract ID (e.g., 0.0.6755654)

-- Tokenization fields  
token_id TEXT -- Fungible token ID from treasury account

-- Status field
status TEXT CHECK (status IN ('draft', 'pending', 'approved', 'certified', 'tokenized'))
```

### Property Certificates Table
```sql
CREATE TABLE property_certificates (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  certificate_hash TEXT UNIQUE,
  nft_token_id TEXT, -- Always the pre-deployed contract ID
  status TEXT DEFAULT 'minted',
  ipfs_metadata_url TEXT,
  issued_by UUID REFERENCES auth.users(id)
);
```

### Property Treasury Accounts Table
```sql
CREATE TABLE property_treasury_accounts (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  hedera_account_id TEXT UNIQUE,
  token_id TEXT, -- Fungible token ID
  status TEXT DEFAULT 'active'
);
```

## API Endpoints

### Certification
- **POST** `/api/generate-certificate`
  - **Purpose**: Generate verification NFT certificate
  - **Requires**: Property in `approved` status
  - **Result**: Property becomes `certified`

### Tokenization
- **POST** `/api/tokenize-property`
  - **Purpose**: Create fungible tokens for trading
  - **Requires**: Property in `certified` status
  - **Result**: Property becomes `tokenized`

## Environment Variables

```bash
# Pre-deployed certificate contract
CERTIFICATE_CONTRACT_ID=0.0.6755654

# Hedera operator credentials
MY_ACCOUNT_ID=your_operator_id
MY_PRIVATE_KEY=your_private_key
```

## Benefits of This Architecture

1. **Clear Separation**: Certification and tokenization are distinct processes
2. **Cost Efficiency**: Reuses pre-deployed contract for certificates
3. **Flexibility**: Properties can be certified without being tokenized
4. **Compliance**: Ensures proper verification before trading
5. **Scalability**: Each property gets its own fungible token contract

## Migration Notes

### Existing Properties
- Properties with `certificate_token_id` are considered `certified`
- Properties with `token_id` are considered `tokenized`
- Update status field accordingly

### UI Updates Needed
- Separate "Certify" and "Tokenize" buttons
- Show certification status independently
- Display both certificate NFT and fungible token information
- Update property detail pages to show both states

## HashScan URLs

### Certificate NFT
```
https://hashscan.io/testnet/token/0.0.6755654/{serial_number}
```

### Fungible Token
```
https://hashscan.io/testnet/token/{token_id}
```

This architecture provides a clear, scalable, and compliant system for property verification and tokenization on the Hedera network.
