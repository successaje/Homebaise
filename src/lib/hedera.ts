import { Client, AccountCreateTransaction, PrivateKey, PublicKey, Hbar } from '@hashgraph/sdk';

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
    const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/balances?account.id=${accountId}`;
    const response = await fetch(mirrorNodeUrl);
    const data = await response.json();

    if (data.balances && data.balances.length > 0) {
      const balanceInTinybars = data.balances[0].balance;
      return balanceInTinybars / 100000000;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching account balance:', error);
    return 0;
  }
}
