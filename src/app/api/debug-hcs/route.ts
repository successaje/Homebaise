import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const supabase = createClient();

    // Check if property has treasury account with topic_id
    const { data: treasuryData, error: treasuryError } = await supabase
      .from('property_treasury_accounts')
      .select('*')
      .eq('property_id', propertyId)
      .single();

    if (treasuryError) {
      return NextResponse.json({ 
        error: 'Treasury account not found',
        details: treasuryError.message 
      }, { status: 404 });
    }

    // Check if there are any property events
    const { data: eventsData, error: eventsError } = await supabase
      .from('property_events')
      .select('*')
      .eq('property_id', propertyId)
      .order('timestamp', { ascending: false });

    // Check environment variables
    const hasHederaCredentials = !!(
      process.env.MY_ACCOUNT_ID || process.env.NEXT_PUBLIC_MY_ACCOUNT_ID
    ) && !!(
      process.env.MY_PRIVATE_KEY || process.env.NEXT_PUBLIC_MY_PRIVATE_KEY
    );

    return NextResponse.json({
      propertyId,
      treasuryAccount: {
        exists: !!treasuryData,
        hasTopicId: !!treasuryData?.topic_id,
        topicId: treasuryData?.topic_id || null,
        tokenId: treasuryData?.token_id || null,
        status: treasuryData?.status || null
      },
      events: {
        count: eventsData?.length || 0,
        events: eventsData || [],
        error: eventsError?.message || null
      },
      environment: {
        hasHederaCredentials,
        accountId: process.env.MY_ACCOUNT_ID || process.env.NEXT_PUBLIC_MY_ACCOUNT_ID || 'Not set',
        hasPrivateKey: !!(process.env.MY_PRIVATE_KEY || process.env.NEXT_PUBLIC_MY_PRIVATE_KEY)
      }
    });

  } catch (error) {
    console.error('Debug HCS error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
