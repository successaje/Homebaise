# Property Tokenization Workflow

This document explains the complete property tokenization workflow implemented on Hedera Hashgraph.

## Overview

The system creates a dedicated treasury account for each property and uses it to manage HTS tokens (fungible or NFT) with a 1:1 ratio to the property value.

## Architecture

### 1. Treasury Account Creation
- **Per Property**: Each property gets its own dedicated Hedera account
- **ECDSA Keys**: Each treasury account has unique ECDSA key pair
- **Initial Balance**: 10 HBAR initial balance for transaction fees
- **Storage**: Account details stored in `property_treasury_accounts` table

### 2. Token Creation
- **Fungible Tokens**: HTS tokens representing fractional ownership
- **NFT Certificates**: Unique certificates for property verification
- **Supply Ratio**: 1:1 ratio with property value (e.g., $1M property = 1M tokens)
- **Decimals**: 18 decimals internally, displayed as 2 for simplicity

### 3. Database Schema

#### `property_treasury_accounts` Table
```sql
CREATE TABLE property_treasury_accounts (
    id UUID PRIMARY KEY,
    property_id UUID REFERENCES properties(id),
    hedera_account_id TEXT UNIQUE,
    hedera_public_key TEXT,
    hedera_private_key TEXT,
    initial_balance_hbar DECIMAL(10,2),
    current_balance_hbar DECIMAL(10,2),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

## Implementation

### 1. Hedera Utilities (`src/lib/hedera-treasury.ts`)

#### Core Functions:
- `createPropertyTreasuryAccount()`: Creates new Hedera account
- `createPropertyToken()`: Creates fungible HTS token
- `createPropertyNFT()`: Creates NFT certificate
- `mintTokens()`: Mints additional tokens
- `transferTokens()`: Transfers tokens between accounts

#### Key Features:
- **Account Creation**: Uses `AccountCreateTransaction` with ECDSA keys
- **Token Creation**: Uses `TokenCreateTransaction` with treasury account
- **Supply Management**: Finite supply with max supply limits
- **Error Handling**: Comprehensive error handling and logging

### 2. API Endpoint (`/api/tokenize-property`)

#### Request Body:
```json
{
  "propertyId": "uuid",
  "tokenType": "fungible" | "nft",
  "tokenSymbol": "HPROP",
  "tokenDecimals": 18,
  "tokenName": "Property Name Token"
}
```

#### Process Flow:
1. **Authentication**: Verify user owns the property
2. **Treasury Creation**: Create Hedera account with 10 HBAR
3. **Database Storage**: Save account details to Supabase
4. **Token Creation**: Mint tokens on Hedera
5. **Property Update**: Update property status and token info

### 3. Frontend Integration (`UserProperties` Component)

#### Features:
- **Tokenization Modal**: Configure token parameters
- **Status Display**: Show tokenization status
- **Treasury Info**: Display account ID and balance
- **Real-time Updates**: Refresh data after tokenization

## Usage

### 1. Setup Database
Run the SQL script to create the treasury accounts table:
```bash
# In Supabase SQL Editor
\i supabase-treasury-setup.sql
```

### 2. Environment Variables
Ensure these are set in your `.env.local`:
```bash
HEDERA_OPERATOR_ID=your_operator_id
HEDERA_OPERATOR_PRIVATE_KEY=your_private_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Tokenize a Property
1. Go to Dashboard → My Properties
2. Click "Tokenize" on any property
3. Configure token parameters:
   - **Token Name**: Descriptive name for the token
   - **Token Type**: Fungible (HTS) or NFT Certificate
   - **Symbol**: Short token symbol (e.g., HPROP)
   - **Decimals**: Number of decimal places (default: 18)
4. Click "Start Tokenization"

## Token Economics

### Fungible Tokens
- **Supply**: Equal to property value in smallest units
- **Example**: $1M property with 18 decimals = 1,000,000,000,000,000,000 tokens
- **Display**: Shows as 1,000,000.00 tokens (2 decimal places)
- **Pricing**: $1 per token (1:1 ratio)

### NFT Certificates
- **Supply**: 1 unique certificate per property
- **Purpose**: Property verification and compliance
- **Metadata**: Stored on IPFS with property details

## Security Features

### 1. Row Level Security (RLS)
- Users can only access treasury accounts for their properties
- Property ownership verification before tokenization
- Secure private key storage in database

### 2. Hedera Security
- **ECDSA Keys**: Each treasury account has unique keys
- **Account Isolation**: No shared accounts between properties
- **Transaction Signing**: All operations require proper signatures

### 3. Access Control
- **Authentication Required**: Must be logged in to tokenize
- **Property Ownership**: Can only tokenize owned properties
- **One-time Tokenization**: Properties can only be tokenized once

## Future Enhancements

### 1. Multi-signature Support
- Allow multiple signers for treasury accounts
- Implement key rotation mechanisms
- Add governance controls

### 2. Advanced Token Features
- **Dividend Distribution**: Automatic profit sharing
- **Voting Rights**: Token holder governance
- **Staking Mechanisms**: Yield generation for holders

### 3. Compliance Features
- **KYC Integration**: Investor verification
- **Regulatory Reporting**: Automated compliance
- **Audit Trails**: Complete transaction history

## Troubleshooting

### Common Issues:

1. **"Property already has a treasury account"**
   - Solution: Check if property was previously tokenized
   - Check `property_treasury_accounts` table

2. **"Failed to create treasury account"**
   - Check Hedera network connectivity
   - Verify operator account has sufficient HBAR
   - Check environment variables

3. **"Token creation failed"**
   - Verify treasury account was created successfully
   - Check Hedera network status
   - Review transaction logs

### Debug Steps:
1. Check browser console for error messages
2. Verify Supabase connection and RLS policies
3. Check Hedera network status
4. Review API endpoint logs

## API Reference

### POST `/api/tokenize-property`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "propertyId": "uuid",
  "tokenType": "fungible" | "nft",
  "tokenSymbol": "string",
  "tokenDecimals": number,
  "tokenName": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Property successfully tokenized as fungible",
  "treasuryAccount": {
    "accountId": "0.0.12345",
    "publicKey": "302a300506032b6570032100...",
    "initialBalance": "10"
  },
  "token": {
    "tokenId": "0.0.67890",
    "tokenName": "Property Name Token",
    "tokenSymbol": "HPROP",
    "totalSupply": "1000000000000000000000000",
    "treasuryAccountId": "0.0.12345"
  },
  "property": {
    "id": "uuid",
    "status": "active"
  }
}
```

## Support

For technical support or questions about the tokenization workflow, please refer to the codebase or contact the development team. 