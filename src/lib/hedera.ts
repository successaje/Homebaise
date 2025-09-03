import { Client, AccountCreateTransaction, PrivateKey, PublicKey, Hbar, TokenCreateTransaction, TokenType, TokenSupplyType, TokenAssociateTransaction, TransferTransaction, TokenMintTransaction } from '@hashgraph/sdk';

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
