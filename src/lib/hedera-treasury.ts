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
  TokenId
} from "@hashgraph/sdk";

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

    // Build the transaction and set fee before freezing
    const transaction = new TokenCreateTransaction()
      .setTokenName(metadata.name)
      .setTokenSymbol(metadata.symbol)
      .setDecimals(metadata.decimals)
      .setInitialSupply(metadata.initialSupply)
      .setTreasuryAccountId(treasuryAccountId)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(metadata.maxSupply)
      .setTokenType(TokenType.FungibleCommon)
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
    const balance = await client.getAccountBalance(operatorAccountId);
    console.log(`Operator account balance before NFT creation: ${balance.hbars.toString()} HBAR`);
    if (balance.hbars.toTinybars() < new Hbar(5).toTinybars()) {
      throw new Error(`Insufficient operator balance. Need at least 5 HBAR, have ${balance.hbars.toString()}`);
    }

    const treasuryAccountId = AccountId.fromString(metadata.treasuryAccountId);

    // Build the transaction and set fee before freezing
    const transaction = new TokenCreateTransaction()
      .setTokenName(metadata.name)
      .setTokenSymbol(metadata.symbol)
      .setTokenType(TokenType.NonFungibleUnique)
      .setTreasuryAccountId(treasuryAccountId)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(metadata.maxSupply)
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
      .setTokenType(TokenType.NonFungibleUnique)
      .setMetadata(Buffer.from(metadata, "utf8"));

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
    const account = AccountId.fromString(accountId);
    const balance = await client.getAccountBalance(account);
    return balance.hbars;
  } catch (error) {
    console.error("Error getting account balance:", error);
    throw new Error(`Failed to get account balance: ${error}`);
  }
} 