import { NextRequest, NextResponse } from 'next/server';

// Webhook endpoint for receiving bot updates
// This can be used for webhook-based bot setup instead of polling
export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    
    // Verify webhook secret in production
    // const secret = request.headers.get('x-telegram-bot-api-secret-token');
    
    console.log('Bot webhook received:', update);
    
    // Process update here
    // For now, the bot uses long polling, but this endpoint can be used for webhooks
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

