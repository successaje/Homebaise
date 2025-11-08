import { Client, AccountCreateTransaction, PrivateKey, Hbar } from '@hashgraph/sdk';

interface HederaAccountResult {
  accountId: string;
  evmAddress: string;
  privateKey: string;
  publicKey: string;
  balance: number;
}

const MIRROR_NODE_URL = 'https://testnet.mirrornode.hedera.com/api/v1';

export function hasHederaOperatorCredentials(): boolean {
  const operatorId = process.env.MY_ACCOUNT_ID || process.env.NEXT_PUBLIC_MY_ACCOUNT_ID;
  const operatorKey = process.env.MY_PRIVATE_KEY || process.env.NEXT_PUBLIC_MY_PRIVATE_KEY;
  return Boolean(operatorId && operatorKey);
}

function getOperatorCredentials() {
  const operatorId = process.env.MY_ACCOUNT_ID || process.env.NEXT_PUBLIC_MY_ACCOUNT_ID;
  const operatorKey = process.env.MY_PRIVATE_KEY || process.env.NEXT_PUBLIC_MY_PRIVATE_KEY;

  if (!operatorId || !operatorKey) {
    throw new Error('Missing Hedera operator credentials in environment variables');
  }

  return { operatorId, operatorKey };
}

export async function createHederaAccount(): Promise<HederaAccountResult> {
  const { operatorId, operatorKey } = getOperatorCredentials();

  const client = Client.forTestnet().setOperator(operatorId, operatorKey);
  const newPrivateKey = PrivateKey.generateECDSA();
  const newPublicKey = newPrivateKey.publicKey;

  const transaction = new AccountCreateTransaction()
    .setKey(newPublicKey)
    .setInitialBalance(new Hbar(20));

  const txResponse = await transaction.execute(client);
  const receipt = await txResponse.getReceipt(client);

  if (!receipt.accountId) {
    client.close();
    throw new Error('Failed to create Hedera account');
  }

  // Allow mirror node to index the new account
  await new Promise((resolve) => setTimeout(resolve, 6000));

  const balance = await getAccountBalance(receipt.accountId.toString());

  client.close();

  return {
    accountId: receipt.accountId.toString(),
    evmAddress: `0x${newPublicKey.toEvmAddress()}`,
    privateKey: newPrivateKey.toString(),
    publicKey: newPublicKey.toString(),
    balance,
  };
}

export async function getAccountBalance(accountId: string): Promise<number> {
  if (!accountId) return 0;

  const cleanAccountId = accountId.trim();
  
  try {
    const response = await fetch(`${MIRROR_NODE_URL}/balances?account.id=${cleanAccountId}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Mirror node balance error (${response.status}):`, errorText);
      return 0;
    }

    const data = await response.json() as { balances?: Array<{ balance?: number }> };
    const balanceRow = data?.balances?.[0];

    if (!balanceRow) {
      return 0;
    }

    return Number(balanceRow.balance || 0) / 100_000_000;
  } catch (error) {
    console.warn(`Unable to query Hedera balance for ${cleanAccountId}:`, error);
    return 0;
  }
}

export async function getHbarUsdPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd'
    );

    if (!response.ok) {
      return 0.0;
    }

    const data = await response.json() as { [key: string]: { usd?: number } };
    const price = data?.['hedera-hashgraph']?.usd;
    return typeof price === 'number' ? price : 0.0;
  } catch (error) {
    console.error('Failed to fetch HBAR price:', error);
    return 0.0;
  }
}


