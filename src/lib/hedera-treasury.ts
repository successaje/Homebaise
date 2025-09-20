import {
  AccountCreateTransaction,
  PrivateKey,
  PublicKey,
  Hbar,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenAssociateTransaction,
  TransferTransaction,
  Client,
  AccountId,
  TokenId,
  AccountBalanceQuery
} from "@hashgraph/sdk";

// NOTE: We rely on Supabase for resolving a property's treasury account and token id
// and use Hedera Mirror Node to fetch live token balances.
import { supabase } from '@/lib/supabase';

export interface TreasuryAccount {
  accountId: string;
  publicKey: string;
  privateKey: string;
  initialBalance: Hbar;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: number;
  maxSupply: number;
  treasuryAccountId: string;
  propertyId: string;
}

export interface MintedToken {
  tokenId: string;
  tokenName: string;
  tokenSymbol: string;
  totalSupply: string;
  treasuryAccountId: string;
}

/**
 * Create a treasury account for a property
 */
export async function createPropertyTreasuryAccount(
  client: Client,
  initialBalance: Hbar = new Hbar(20)
): Promise<TreasuryAccount> {
  try {
    // Generate a new ECDSA key pair for the treasury account
    const privateKey = PrivateKey.generateECDSA();
    const publicKey = privateKey.publicKey;

    // Create the account with higher transaction fee
    const transaction = new AccountCreateTransaction()
      .setECDSAKeyWithAlias(privateKey)
      // .setKey(publicKey)
      .setInitialBalance(new Hbar(20))
      .setAccountMemo("A Property Treasury Account");

    // Sign and execute the transaction with higher fee
    const response = await transaction
      // .setMaxTransactionFee(new Hbar(20))
      .execute(client);

    // Get the receipt
    const receipt = await response.getReceipt(client);
    const accountId = receipt.accountId;

    if (!accountId) {
      throw new Error("Failed to get account ID from receipt");
    }

    return {
      accountId: accountId.toString(),
      publicKey: publicKey.toString(),
      privateKey: privateKey.toString(),
      initialBalance
    };
  } catch (error) {
    console.error("Error creating treasury account:", error);
    throw new Error(`Failed to create treasury account: ${error}`);
  }
}

/**
 * Create a fungible token for a property
 */
export async function createPropertyToken(
  client: Client,
  metadata: TokenMetadata,
  treasuryPrivateKey: string
): Promise<MintedToken> {
  try {
    const treasuryAccountId = AccountId.fromString(metadata.treasuryAccountId);

    // Build a descriptive token memo
    const referenceCode = `HB-PRPTY-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
    const tokenMemo = `Homebaise | ${metadata.name} | Tokenized RE | ${referenceCode}`;

    // Build the transaction and set fee before freezing
    const transaction = new TokenCreateTransaction()
      .setTokenName(metadata.name)
      .setTokenSymbol(metadata.symbol)
      .setInitialSupply(metadata.initialSupply)
      .setTreasuryAccountId(treasuryAccountId)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(metadata.maxSupply)
      .setTokenType(TokenType.FungibleCommon)
      .setTokenMemo(tokenMemo)
      .setMaxTransactionFee(new Hbar(5));

    // Freeze then sign with treasury key, then execute
    const frozen = await transaction.freezeWith(client);
    const signedTx = await frozen.sign(PrivateKey.fromString(treasuryPrivateKey));
    const response = await signedTx.execute(client);

    const receipt = await response.getReceipt(client);
    const tokenId = receipt.tokenId;

    if (!tokenId) {
      throw new Error("Failed to get token ID from receipt");
    }

    return {
      tokenId: tokenId.toString(),
      tokenName: metadata.name,
      tokenSymbol: metadata.symbol,
      totalSupply: metadata.initialSupply.toString(),
      treasuryAccountId: metadata.treasuryAccountId
    };
  } catch (error) {
    console.error("Error creating property token:", error);
    throw new Error(`Failed to create property token: ${error}`);
  }
}

/**
 * Create an NFT certificate for a property
 */
export async function createPropertyNFT(
  client: Client,
  metadata: TokenMetadata,
  treasuryPrivateKey: string
): Promise<MintedToken> {
  try {
    const operatorAccountId = client.operatorAccountId;
    if (!operatorAccountId) {
      throw new Error("Client not configured with operator account");
    }
    const balance = await new AccountBalanceQuery().setAccountId(operatorAccountId).execute(client);
    console.log(`Operator account balance before NFT creation: ${balance.hbars.toString()} HBAR`);
    if (balance.hbars.toTinybars() < new Hbar(5).toTinybars()) {
      throw new Error(`Insufficient operator balance. Need at least 5 HBAR, have ${balance.hbars.toString()}`);
    }

    const treasuryAccountId = AccountId.fromString(metadata.treasuryAccountId);

    // Build a descriptive token memo
    const referenceCode = `HB-PRPTY-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
    const tokenMemo = `Homebaise | ${metadata.name} | Tokenized RE | ${referenceCode}`;

    // Build the transaction and set fee before freezing
    const transaction = new TokenCreateTransaction()
      .setTokenName(metadata.name)
      .setTokenSymbol(metadata.symbol)
      .setTokenType(TokenType.NonFungibleUnique)
      .setDecimals(0)
      .setInitialSupply(0)
      .setTreasuryAccountId(treasuryAccountId)
      .setMaxSupply(metadata.maxSupply)
      .setTokenMemo(tokenMemo)
      .setMaxTransactionFee(new Hbar(5));

    // Freeze then sign with treasury key, then execute
    const frozen = await transaction.freezeWith(client);
    const signedTx = await frozen.sign(PrivateKey.fromString(treasuryPrivateKey));
    const response = await signedTx.execute(client);

    const receipt = await response.getReceipt(client);
    const tokenId = receipt.tokenId;

    if (!tokenId) {
      throw new Error("Failed to get token ID from receipt");
    }

    console.log(`Successfully created NFT token: ${tokenId.toString()}`);

    return {
      tokenId: tokenId.toString(),
      tokenName: metadata.name,
      tokenSymbol: metadata.symbol,
      totalSupply: "1",
      treasuryAccountId: metadata.treasuryAccountId
    };
  } catch (error) {
    console.error("Error creating property NFT:", error);
    throw new Error(`Failed to create property NFT: ${error}`);
  }
}

/**
 * Mint additional tokens (for fungible tokens)
 */
export async function mintTokens(
  client: Client,
  tokenId: string,
  amount: number,
  treasuryAccountId: string
): Promise<void> {
  try {
    const token = TokenId.fromString(tokenId);
    const treasuryAccount = AccountId.fromString(treasuryAccountId);

    const transaction = new TokenMintTransaction()
      .setTokenId(token)
      .setAmount(amount);

    // Sign and execute the transaction with higher fee
    await transaction
      .setMaxTransactionFee(new Hbar(5))
      .execute(client);

    console.log(`Successfully minted ${amount} tokens`);
  } catch (error) {
    console.error("Error minting tokens:", error);
    throw new Error(`Failed to mint tokens: ${error}`);
  }
}

/**
 * Mint NFT (for non-fungible tokens)
 */
export async function mintNFT(
  client: Client,
  tokenId: string,
  metadata: string,
  treasuryAccountId: string
): Promise<void> {
  try {
    const token = TokenId.fromString(tokenId);
    const treasuryAccount = AccountId.fromString(treasuryAccountId);

    const transaction = new TokenMintTransaction()
      .setTokenId(token)
      .setMetadata([new Uint8Array(Buffer.from(metadata, "utf8"))]);

    // Sign and execute the transaction with higher fee
    await transaction
      .setMaxTransactionFee(new Hbar(5))
      .execute(client);

    console.log("Successfully minted NFT");
  } catch (error) {
    console.error("Error minting NFT:", error);
    throw new Error(`Failed to mint NFT: ${error}`);
  }
}

/**
 * Transfer tokens from treasury to a recipient
 */
export async function transferTokens(
  client: Client,
  tokenId: string,
  fromAccountId: string,
  toAccountId: string,
  amount: number
): Promise<void> {
  try {
    const token = TokenId.fromString(tokenId);
    const fromAccount = AccountId.fromString(fromAccountId);
    const toAccount = AccountId.fromString(toAccountId);

    const transaction = new TransferTransaction()
      .addTokenTransfer(token, fromAccount, -amount)
      .addTokenTransfer(token, toAccount, amount);

    // Sign and execute the transaction with higher fee
    await transaction
      .setMaxTransactionFee(new Hbar(5))
      .execute(client);

    console.log(`Successfully transferred ${amount} tokens`);
  } catch (error) {
    console.error("Error transferring tokens:", error);
    throw new Error(`Failed to transfer tokens: ${error}`);
  }
}

/**
 * Get account balance
 */
export async function getAccountBalance(
  client: Client,
  accountId: string
): Promise<Hbar> {
  try {
    const balance = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);
    
    return balance.hbars;
  } catch (error) {
    console.error('Error fetching account balance:', error);
    throw new Error(`Failed to fetch account balance: ${error}`);
  }
}

/**
 * Get the actual fungibletoken balance for a property from the property_treasury_accounts table
 */
export async function getPropertyFungibleTokenBalance(propertyId: string): Promise<number | null> {
  try {
    const {data, error } = await supabase
      .from('property_treasury_accounts')
      .select('token_balance')
      .eq('property_id', propertyId)
      .single();

      if (error){
        console.log("Error fetching property fungible token balance", error);
        return null;
      }

      if (!data){
        console.log("No data found for property's funginle token balance", propertyId);
        return null;
      }
      console.log("Property's fungible token balance", data.token_balance);
      return data.token_balance;
  } catch (error) {
    console.error('Error fetching property fungible token balance:', error);
    throw new Error(`Failed to fetch property fungible token balance: ${error}`);
  }
}

/**
 * Get the token balance for a property from the property_treasury_accounts table
 */
export async function getPropertyTokenBalance(propertyId: string): Promise<number | null> {
  try {
    // Resolve treasury info first
    const { data, error } = await supabase
      .from('property_treasury_accounts')
      .select('hedera_account_id, token_id, initial_balance_hbar')
      .eq('property_id', propertyId)
      .single();

    // If no row exists yet, return 0 quietly (property not tokenized/treasury not created)
    if (error?.code === 'PGRST116' || !data) {
      console.warn('No treasury account found for property; returning 0', { propertyId });
      console.log("The test property id is here: ",JSON.stringify(propertyId));
      return 0;
    }

    if (error) {
      console.error('Error fetching treasury account for property', { propertyId, error });
      return 0;
    }

    const hederaAccountId = (data as any)?.hedera_account_id as string | null;
    const tokenId = (data as any)?.token_id as string | null;

    // If we have mirror-readable identifiers, fetch live balance from Mirror Node
    if (hederaAccountId && tokenId) {
      const mirrorBalance = await getTokenBalanceFromMirror(hederaAccountId, tokenId);
      if (mirrorBalance !== null) return mirrorBalance;
    }

    // Fallback to last known balance stored in DB
    return (data as any)?.initial_balance_hbar || 0;
  } catch (error) {
    console.error('Error in getPropertyTokenBalance', { propertyId, error });
    return 0;
  }
}

/**
 * Fetch the token balance for a specific account+token from Hedera Mirror Node
 * GET /api/v1/accounts/{hedera_account_id}/tokens?token.id={tokenId}
 */
export async function getTokenBalanceFromMirror(
  hederaAccountId: string,
  tokenId: string
): Promise<number | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_HEDERA_MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com';
    const url = `${baseUrl}/api/v1/accounts/${encodeURIComponent(hederaAccountId)}/tokens?token.id=${encodeURIComponent(tokenId)}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error('Mirror node response not ok:', res.status, res.statusText);
      return null;
    }

    const json = await res.json();
    // Response shape: { tokens: [{ token_id, balance, decimals }] }
    const tokens = json?.tokens as Array<{ token_id: string; balance: string | number; decimals?: number }> | undefined;
    if (!tokens || tokens.length === 0) return 0;

    const entry = tokens.find(t => t.token_id === tokenId) || tokens[0];
    if (!entry) return 0;

    const rawBalance = typeof entry.balance === 'string' ? parseFloat(entry.balance) : entry.balance;
    const decimals = entry.decimals ?? 0;

    // Convert to whole tokens based on decimals
    const divisor = Math.pow(10, decimals);
    const wholeTokens = divisor > 0 ? Math.floor(rawBalance / divisor) : Math.floor(rawBalance);
    return wholeTokens;
  } catch (error) {
    console.error('Error fetching token balance from mirror:', error);
    return null;
  }
}