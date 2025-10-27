import { NextRequest, NextResponse } from 'next/server';
import { createPropertyTopic, submitHCSMessage, getHederaClient } from '@/lib/hedera-hcs';

export async function POST(request: NextRequest) {
  try {
    const { propertyId, testMessage } = await request.json();

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Test 1: Check if we can create a Hedera client
    let clientTest = false;
    try {
      const client = getHederaClient();
      client.close();
      clientTest = true;
    } catch (error) {
      console.error('Client creation failed:', error);
    }

    // Test 2: Try to create a topic
    let topicId = null;
    let topicError = null;
    try {
      topicId = await createPropertyTopic(propertyId);
    } catch (error) {
      topicError = error instanceof Error ? error.message : 'Unknown error';
      console.error('Topic creation failed:', error);
    }

    // Test 3: Try to submit a message (if topic was created)
    let messageResult = null;
    let messageError = null;
    if (topicId) {
      try {
        const testEvent = {
          event: 'test',
          property_id: propertyId,
          timestamp: new Date().toISOString(),
          transaction_id: 'test_' + Date.now(),
          metadata: {
            test_message: testMessage || 'Test HCS message',
            platform: 'homebaise',
            version: '1.0'
          }
        };

        const messageTxId = await submitHCSMessage(topicId, testEvent);
        messageResult = {
          success: true,
          transactionId: messageTxId,
          topicId: topicId
        };
      } catch (error) {
        messageError = error instanceof Error ? error.message : 'Unknown error';
        console.error('Message submission failed:', error);
      }
    }

    return NextResponse.json({
      propertyId,
      tests: {
        clientCreation: {
          success: clientTest,
          error: clientTest ? null : 'Failed to create Hedera client'
        },
        topicCreation: {
          success: !!topicId,
          topicId: topicId,
          error: topicError
        },
        messageSubmission: {
          success: !!messageResult,
          result: messageResult,
          error: messageError
        }
      },
      environment: {
        accountId: process.env.MY_ACCOUNT_ID || process.env.NEXT_PUBLIC_MY_ACCOUNT_ID || 'Not set',
        hasPrivateKey: !!(process.env.MY_PRIVATE_KEY || process.env.NEXT_PUBLIC_MY_PRIVATE_KEY)
      }
    });

  } catch (error) {
    console.error('Test HCS error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
