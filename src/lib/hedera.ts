import { Client, AccountCreateTransaction, PrivateKey, PublicKey, Hbar, TokenCreateTransaction, TokenType, TokenSupplyType, TokenAssociateTransaction, TransferTransaction, TokenMintTransaction, AccountId, TokenId } from '@hashgraph/sdk';

interface HederaAccountResult {
  accountId: string;
  evmAddress: string;
  privateKey: string;
  publicKey: string;
  balance: number;
}

export async function createHederaAccount(): Promise<HederaAccountResult> {
  try {
    // Get operator credentials from environment variables
    const operatorId = process.env.MY_ACCOUNT_ID || process.env.NEXT_PUBLIC_MY_ACCOUNT_ID;
    const operatorKey = process.env.MY_PRIVATE_KEY || process.env.NEXT_PUBLIC_MY_PRIVATE_KEY;

    if (!operatorId || !operatorKey) {
      throw new Error('Hedera operator credentials not found in environment variables');
    }

    // Initialize the client for testnet
    const client = Client.forTestnet()
      .setOperator(operatorId, operatorKey);

    // Generate a new key pair for the user
    const newPrivateKey = PrivateKey.generateECDSA();
    const newPublicKey = newPrivateKey.publicKey;

    // Build and execute the account creation transaction
    const transaction = new AccountCreateTransaction()
      .setKey(newPublicKey)
      .setInitialBalance(new Hbar(20)); // Fund with 20 HBAR

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const newAccountId = receipt.accountId;

    if (!newAccountId) {
      throw new Error('Failed to create Hedera account');
    }

    // Wait for Mirror Node to populate data
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Query balance using Mirror Node
    const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/balances?account.id=${newAccountId}`;
    const response = await fetch(mirrorNodeUrl);
    const data = await response.json();

    let balanceInHbar = 20; // Default to initial balance
    if (data.balances && data.balances.length > 0) {
      const balanceInTinybars = data.balances[0].balance;
      balanceInHbar = balanceInTinybars / 100000000;
    }

    client.close();

    return {
      accountId: newAccountId.toString(),
      evmAddress: `0x${newPublicKey.toEvmAddress()}`,
      privateKey: newPrivateKey.toString(),
      publicKey: newPublicKey.toString(),
      balance: balanceInHbar
    };
  } catch (error) {
    console.error('Error creating Hedera account:', error);
    if (error instanceof Error) {
      throw new Error(`Hedera account creation failed: ${error.message}`);
    }
    throw new Error('Hedera account creation failed for an unknown reason');
  }
}

export async function getAccountBalance(accountId: string): Promise<number> {
  try {
    if (!accountId) {
      console.error('No account ID provided to getAccountBalance');
      return 0;
    }

    // Clean up the account ID format if needed
    const cleanAccountId = accountId.trim();
    console.log(`Fetching balance for account: ${cleanAccountId}`);
    
    const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/balances?account.id=${cleanAccountId}`;
    console.log(`Making request to: ${mirrorNodeUrl}`);
    
    const response = await fetch(mirrorNodeUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from mirror node (${response.status}):`, errorText);
      return 0;
    }
    
    const data = await response.json();
    console.log('Mirror node response:', data);

    if (data.balances && data.balances.length > 0) {
      const balanceInTinybars = data.balances[0].balance;
      const balanceInHbar = balanceInTinybars / 100000000;
      console.log(`Balance for ${cleanAccountId}: ${balanceInHbar} HBAR`);
      return balanceInHbar;
    }
    
    console.log('No balance found for account:', cleanAccountId);
    return 0;
  } catch (error) {
    console.error('Error in getAccountBalance:', error);
    return 0;
  }
}

export interface CreateFungibleTokenInput {
  tokenName: string;
  tokenSymbol: string;
  initialSupply: number;
  decimals?: number;
}

export interface CreateFungibleTokenResult {
  tokenId: string;
}

export async function createFungibleToken(input: CreateFungibleTokenInput): Promise<CreateFungibleTokenResult> {
  const operatorId = process.env.MY_ACCOUNT_ID || process.env.NEXT_PUBLIC_MY_ACCOUNT_ID;
  const operatorKey = process.env.MY_PRIVATE_KEY || process.env.NEXT_PUBLIC_MY_PRIVATE_KEY;
  if (!operatorId || !operatorKey) throw new Error('Missing Hedera operator credentials');

  const client = Client.forTestnet().setOperator(operatorId, operatorKey);
  const supplyKey = PrivateKey.generateECDSA();

  const tx = await new TokenCreateTransaction()
    .setTokenName(input.tokenName)
    .setTokenSymbol(input.tokenSymbol)
    .setTokenType(TokenType.FungibleCommon)
    .setDecimals(input.decimals ?? 2)
    .setInitialSupply(input.initialSupply)
    .setTreasuryAccountId(operatorId)
    .setSupplyType(TokenSupplyType.Infinite)
    .setSupplyKey(supplyKey)
    .freezeWith(client)
    .sign(PrivateKey.fromStringECDSA(operatorKey));

  const submit = await tx.execute(client);
  const receipt = await submit.getReceipt(client);
  if (!receipt.tokenId) throw new Error('Failed to create fungible token');
  client.close();
  return { tokenId: receipt.tokenId.toString() };
}

export interface CreateNftInput {
  tokenName: string;
  tokenSymbol: string;
  maxSupply: number;
  metadataCids: string[]; // array of ipfs://.../metadata.json
}

export interface CreateNftResult {
  tokenId: string;
  mintedSerials: number[];
}

export async function createNftAndMint(input: CreateNftInput): Promise<CreateNftResult> {
  const operatorId = process.env.MY_ACCOUNT_ID || process.env.NEXT_PUBLIC_MY_ACCOUNT_ID;
  const operatorKey = process.env.MY_PRIVATE_KEY || process.env.NEXT_PUBLIC_MY_PRIVATE_KEY;
  if (!operatorId || !operatorKey) throw new Error('Missing Hedera operator credentials');

  const client = Client.forTestnet().setOperator(operatorId, operatorKey);
  const supplyKey = PrivateKey.generateECDSA();

  const createTx = await new TokenCreateTransaction()
    .setTokenName(input.tokenName)
    .setTokenSymbol(input.tokenSymbol)
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setTreasuryAccountId(operatorId)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(input.maxSupply)
    .setSupplyKey(supplyKey)
    .freezeWith(client)
    .sign(PrivateKey.fromStringECDSA(operatorKey));

  const createSubmit = await createTx.execute(client);
  const createRx = await createSubmit.getReceipt(client);
  if (!createRx.tokenId) throw new Error('Failed to create NFT token');
  const tokenId = createRx.tokenId;

  const cidBuffers = input.metadataCids.map((c) => Buffer.from(c));
  const mintTx = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .setMetadata(cidBuffers)
    .freezeWith(client)
    .sign(supplyKey);

  const mintSubmit = await mintTx.execute(client);
  const mintRx = await mintSubmit.getReceipt(client);
  const serials = (mintRx.serials ?? []).map((s) => Number(s.toString()));

  client.close();
  return { tokenId: tokenId.toString(), mintedSerials: serials };
}

export interface MintCertificateNFTInput {
  tokenName: string;
  tokenSymbol: string;
  metadataUrl: string;
}

export interface MintCertificateNFTResult {
  tokenId: string;
  serialNumber: number;
}

export async function mintCertificateNFT(input: MintCertificateNFTInput): Promise<MintCertificateNFTResult> {
  const operatorId = process.env.MY_ACCOUNT_ID || process.env.NEXT_PUBLIC_MY_ACCOUNT_ID;
  const operatorKey = process.env.MY_PRIVATE_KEY || process.env.NEXT_PUBLIC_MY_PRIVATE_KEY;
  if (!operatorId || !operatorKey) throw new Error('Missing Hedera operator credentials');

  // Use pre-deployed certificate contract
  const certificateContractId = process.env.CERTIFICATE_CONTRACT_ID || '0.0.6755654';
  
  const client = Client.forTestnet().setOperator(operatorId, operatorKey);
  
  try {
    // Mint NFT from pre-deployed certificate contract
    const mintTx = await new TokenMintTransaction()
      .setTokenId(TokenId.fromString(certificateContractId))
      .setMetadata([Buffer.from(input.metadataUrl)])
      .freezeWith(client)
      .sign(PrivateKey.fromStringECDSA(operatorKey));

    const mintSubmit = await mintTx.execute(client);
    const mintRx = await mintSubmit.getReceipt(client);
    const serials = mintRx.serials ?? [];
    
    if (serials.length === 0) {
      throw new Error('Failed to mint certificate NFT');
    }

    client.close();
    
    return { 
      tokenId: certificateContractId, 
      serialNumber: Number(serials[0].toString()) 
    };
  } catch (error) {
    client.close();
    console.error('Error minting certificate NFT:', error);
    throw new Error(`Failed to mint certificate NFT: ${error}`);
  }
}

export interface SendHbarInput {
  senderAccountId: string;
  senderPrivateKey: string;
  receiverAccountId: string;
  amount: number; // Amount in HBAR
  memo?: string;
}

export interface SendHbarResult {
  transactionId: string;
  status: string;
  hashscanUrl: string;
}

export interface PurchaseTokenInput {
  senderPrivateKey : string;
  receiverAccountId: string;
  propertyId: string;
  amount: number;
  memo?: string;
}

export async function sendHbar(input: SendHbarInput): Promise<SendHbarResult> {
  try {
    const { senderAccountId, senderPrivateKey, receiverAccountId, amount, memo } = input;

    // Validate inputs
    if (!senderAccountId || !senderPrivateKey || !receiverAccountId || amount <= 0) {
      throw new Error('Invalid input parameters for HBAR transfer');
    }

    // Initialize the client for testnet
    const client = Client.forTestnet()
      .setOperator(senderAccountId, senderPrivateKey);

    // Create a transaction to transfer HBAR
    const txTransfer = new TransferTransaction()
      .addHbarTransfer(AccountId.fromString(senderAccountId), new Hbar(-amount))
      .addHbarTransfer(AccountId.fromString(receiverAccountId), new Hbar(amount));

    // Add memo if provided
    if (memo) {
      txTransfer.setTransactionMemo(memo);
    }

    // Submit the transaction to a Hedera network
    const txTransferResponse = await txTransfer.execute(client);

    // Request the receipt of the transaction
    const receiptTransferTx = await txTransferResponse.getReceipt(client);

    // Get the transaction consensus status
    const statusTransferTx = receiptTransferTx.status;

    // Get the Transaction ID
    const txIdTransfer = txTransferResponse.transactionId.toString();

    // Generate HashScan URL
    const hashscanUrl = `https://hashscan.io/testnet/transaction/${txIdTransfer}`;

    console.log("-------------------------------- Transfer HBAR ------------------------------ ");
    console.log("Receipt status           :", statusTransferTx.toString());
    console.log("Transaction ID           :", txIdTransfer);
    console.log("Hashscan URL             :", hashscanUrl);

    client.close();

    return {
      transactionId: txIdTransfer,
      status: statusTransferTx.toString(),
      hashscanUrl: hashscanUrl
    };
  } catch (error) {
    console.error('Error sending HBAR:', error);
    if (error instanceof Error) {
      throw new Error(`HBAR transfer failed: ${error.message}`);
    }
    throw new Error('HBAR transfer failed for an unknown reason');
  }
}

// --------- NEW HELPERS FOR INVEST FLOW ---------

export async function getHbarUsdPrice(): Promise<number> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd', {
      // Avoid cache to get fresh pricing
      cache: 'no-store'
    });
    const data = await res.json().catch(() => ({} as any));
    const price = data?.['hedera-hashgraph']?.usd;
    if (typeof price === 'number' && price > 0) return price;
  } catch {}
  // Sensible fallback if API unavailable
  return 0.1; // $0.10/HBAR fallback
}

export interface EnsureAssociationInput {
  client: Client;
  userAccountId: string;
  userPrivateKey: string;
  tokenId: string;
}

export async function ensureTokenAssociation({ client, userAccountId, userPrivateKey, tokenId }: EnsureAssociationInput): Promise<void> {
  // Validate inputs
  if (!userAccountId || !userPrivateKey || !tokenId) {
    throw new Error('Missing required parameters for token association');
  }

  // Attempt to associate token. If already associated, Hedera returns an error; we swallow it for idempotency.
  try {
    const tx = await new TokenAssociateTransaction()
      .setAccountId(AccountId.fromString(userAccountId))
      .setTokenIds([TokenId.fromString(tokenId)])
      .freezeWith(client)
      .sign(PrivateKey.fromString(userPrivateKey));
    const resp = await tx.execute(client);
    await resp.getReceipt(client);
  } catch (err) {
    const msg = String(err);
    // If association already exists, ignore
    if (!/is already associated|TOKEN_ALREADY_ASSOCIATED/i.test(msg)) {
      throw err;
    }
  }
}

export interface TransferFungibleInput {
  client: Client;
  tokenId: string;
  fromAccountId: string;
  fromPrivateKey: string;
  toAccountId: string;
  // Amount in the token's smallest units (integer)
  amountTiny: number | bigint;
  memo?: string;
}

export async function transferFungible({ client, tokenId, fromAccountId, fromPrivateKey, toAccountId, amountTiny, memo }: TransferFungibleInput): Promise<string> {
  // Convert to number if it's a bigint for compatibility with Hedera SDK
  const amount = typeof amountTiny === 'bigint' ? Number(amountTiny) : amountTiny;
  
  const tx = new TransferTransaction()
    .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(fromAccountId), -amount)
    .addTokenTransfer(TokenId.fromString(tokenId), AccountId.fromString(toAccountId), amount);
  if (memo) tx.setTransactionMemo(memo);

  const signed = await tx.freezeWith(client).sign(PrivateKey.fromString(fromPrivateKey));
  const resp = await signed.execute(client);
  const receipt = await resp.getReceipt(client);
  if (!receipt.status) throw new Error('Token transfer failed');
  return resp.transactionId.toString();
}

export interface TransferHbarInput {
  client: Client;
  fromAccountId: string;
  fromPrivateKey: string;
  toAccountId: string;
  hbarAmount: number; // in HBAR
  memo?: string;
}

export async function transferHbar({ client, fromAccountId, fromPrivateKey, toAccountId, hbarAmount, memo }: TransferHbarInput): Promise<string> {
  const tx = new TransferTransaction()
    .addHbarTransfer(AccountId.fromString(fromAccountId), new Hbar(-hbarAmount))
    .addHbarTransfer(AccountId.fromString(toAccountId), new Hbar(hbarAmount));
  if (memo) tx.setTransactionMemo(memo);

  const signed = await tx.freezeWith(client).sign(PrivateKey.fromString(fromPrivateKey));
  const resp = await signed.execute(client);
  const receipt = await resp.getReceipt(client);
  if (!receipt.status) throw new Error('HBAR transfer failed');
  return resp.transactionId.toString();
}

/**
 * Purchase property tokens - ensures token association and transfers tokens from treasury to buyer
 * This is the complete flow for buying property tokens
 */
export interface PurchasePropertyTokenInput {
  client: Client;
  treasuryAccountId: string;
  treasuryPrivateKey: string;
  buyerAccountId: string;
  buyerPrivateKey: string;
  tokenId: string;
  amount: number;
  memo?: string;
}

export async function purchasePropertyToken({
  client,
  treasuryAccountId,
  treasuryPrivateKey,
  buyerAccountId,
  buyerPrivateKey,
  tokenId,
  amount,
  memo
}: PurchasePropertyTokenInput): Promise<string> {
  // Step 1: Ensure buyer is associated with the token
  await ensureTokenAssociation({
    client,
    userAccountId: buyerAccountId,
    userPrivateKey: buyerPrivateKey,
    tokenId
  });

  // Step 2: Transfer tokens from treasury to buyer
  const txId = await transferFungible({
    client,
    tokenId,
    fromAccountId: treasuryAccountId,
    fromPrivateKey: treasuryPrivateKey,
    toAccountId: buyerAccountId,
    amountTiny: amount,
    memo
  });

  return txId;
}
