import { 
  Client, 
  TopicCreateTransaction, 
  TopicMessageSubmitTransaction,
  PrivateKey,
  AccountId,
  TopicId
} from "@hashgraph/sdk";

// Initialize Hedera client
export function getHederaClient(): Client {
  const operatorId = process.env.MY_ACCOUNT_ID || process.env.NEXT_PUBLIC_MY_ACCOUNT_ID;
  const operatorKey = process.env.MY_PRIVATE_KEY || process.env.NEXT_PUBLIC_MY_PRIVATE_KEY;
  
  if (!operatorId || !operatorKey) {
    throw new Error("Missing Hedera operator credentials");
  }

  const client = Client.forTestnet(); // Use forMainnet() in production
  client.setOperator(AccountId.fromString(operatorId), PrivateKey.fromString(operatorKey));
  
  return client;
}

// HCS Event Types
export interface HCSEvent {
  event: string;
  property_id: string;
  investor?: string;
  amount?: number;
  timestamp: string;
  transaction_id: string;
  metadata?: Record<string, any>;
}

// Create HCS topic for a property
export async function createPropertyTopic(propertyId: string): Promise<string> {
  const client = getHederaClient();
  
  try {
    console.log(`Creating HCS topic for property: ${propertyId}`);
    
    // Create topic with memo for identification
    const topicCreateTx = new TopicCreateTransaction()
      .setTopicMemo(`Property ${propertyId} - Homebaise`)
      .setSubmitKey(null) // Allow anyone to submit messages
      .setAdminKey(null) // No admin key for simplicity
      .setAutoRenewAccountId(null)
      .setAutoRenewPeriod(7000000); // ~3 months

    const txResponse = await topicCreateTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    
    if (!receipt.topicId) {
      throw new Error("Failed to create topic - no topic ID returned");
    }
    
    const topicId = receipt.topicId.toString();
    console.log(`✅ HCS topic created for property ${propertyId}: ${topicId}`);
    
    return topicId;
  } catch (error) {
    console.error(`❌ Error creating HCS topic for property ${propertyId}:`, error);
    throw error;
  } finally {
    client.close();
  }
}

// Submit message to HCS topic
export async function submitHCSMessage(
  topicId: string, 
  event: HCSEvent
): Promise<string> {
  const client = getHederaClient();
  
  try {
    console.log(`Submitting HCS message to topic ${topicId}:`, event);
    
    const messageSubmitTx = new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(topicId))
      .setMessage(JSON.stringify(event));

    const txResponse = await messageSubmitTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    
    const transactionId = txResponse.transactionId.toString();
    console.log(`✅ HCS message submitted: ${transactionId}`);
    console.log(`📋 Receipt status: ${receipt.status}`);
    
    return transactionId;
  } catch (error) {
    console.error(`❌ Error submitting HCS message to topic ${topicId}:`, error);
    console.error(`📋 Error details:`, {
      topicId,
      event,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  } finally {
    client.close();
  }
}

// Submit investment event to HCS
export async function logInvestmentEvent(
  propertyId: string,
  topicId: string,
  investorAccountId: string,
  amount: number,
  transactionId: string,
  metadata?: Record<string, any>
): Promise<string> {
  const event: HCSEvent = {
    event: "investment",
    property_id: propertyId,
    investor: investorAccountId,
    amount: amount,
    timestamp: new Date().toISOString(),
    transaction_id: transactionId,
    metadata: {
      ...metadata,
      platform: "homebaise",
      version: "1.0"
    }
  };

  return await submitHCSMessage(topicId, event);
}

// Submit property creation event to HCS
export async function logPropertyCreationEvent(
  propertyId: string,
  topicId: string,
  propertyData: {
    name: string;
    location: string;
    total_value: number;
    token_symbol: string;
  }
): Promise<string> {
  const event: HCSEvent = {
    event: "property_created",
    property_id: propertyId,
    timestamp: new Date().toISOString(),
    transaction_id: topicId, // Use topic creation as reference
    metadata: {
      property_name: propertyData.name,
      location: propertyData.location,
      total_value: propertyData.total_value,
      token_symbol: propertyData.token_symbol,
      platform: "homebaise",
      version: "1.0"
    }
  };

  return await submitHCSMessage(topicId, event);
}

// Submit token transfer event to HCS
export async function logTokenTransferEvent(
  propertyId: string,
  topicId: string,
  fromAccount: string,
  toAccount: string,
  tokenAmount: number,
  transactionId: string
): Promise<string> {
  const event: HCSEvent = {
    event: "token_transfer",
    property_id: propertyId,
    investor: toAccount,
    amount: tokenAmount,
    timestamp: new Date().toISOString(),
    transaction_id: transactionId,
    metadata: {
      from_account: fromAccount,
      to_account: toAccount,
      token_amount: tokenAmount,
      platform: "homebaise",
      version: "1.0"
    }
  };

  return await submitHCSMessage(topicId, event);
}

// Submit withdrawal event to HCS
export async function logWithdrawalEvent(
  propertyId: string,
  topicId: string,
  investorAccountId: string,
  amount: number,
  transactionId: string,
  reason?: string
): Promise<string> {
  const event: HCSEvent = {
    event: "withdrawal",
    property_id: propertyId,
    investor: investorAccountId,
    amount: amount,
    timestamp: new Date().toISOString(),
    transaction_id: transactionId,
    metadata: {
      reason: reason || "investor_withdrawal",
      platform: "homebaise",
      version: "1.0"
    }
  };

  return await submitHCSMessage(topicId, event);
}

// Get HashScan URL for topic
export function getHashScanTopicUrl(topicId: string, network: 'testnet' | 'mainnet' = 'testnet'): string {
  return `https://hashscan.io/${network}/topic/${topicId}`;
}

// Get HashScan URL for transaction
export function getHashScanTransactionUrl(transactionId: string, network: 'testnet' | 'mainnet' = 'testnet'): string {
  return `https://hashscan.io/${network}/transaction/${transactionId}`;
}

// Validate topic ID format
export function isValidTopicId(topicId: string): boolean {
  const topicIdRegex = /^\d+\.\d+\.\d+$/;
  return topicIdRegex.test(topicId);
}

// Parse HCS message from JSON
export function parseHCSMessage(message: string): HCSEvent | null {
  try {
    return JSON.parse(message) as HCSEvent;
  } catch (error) {
    console.error("Error parsing HCS message:", error);
    return null;
  }
}
