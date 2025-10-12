import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/marketplace/statistics - Get market statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'property_id is required' },
        { status: 400 }
      );
    }

    // Get or create statistics
    const { data: stats, error } = await supabase
      .from('marketplace_statistics')
      .select('*')
      .eq('property_id', propertyId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching statistics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    // If no stats exist, calculate them
    if (!stats) {
      // Calculate 24h stats
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: trades24h } = await supabase
        .from('marketplace_trades')
        .select('token_amount, price_per_token')
        .eq('property_id', propertyId)
        .eq('status', 'completed')
        .gte('completed_at', oneDayAgo);

      const volume24h = trades24h?.reduce((sum, t) => sum + t.token_amount, 0) || 0;
      const trades24hCount = trades24h?.length || 0;

      // Get best bid and ask
      const { data: bestBid } = await supabase
        .from('marketplace_orders')
        .select('price_per_token')
        .eq('property_id', propertyId)
        .eq('order_type', 'buy')
        .in('status', ['open', 'partially_filled'])
        .order('price_per_token', { ascending: false })
        .limit(1)
        .single();

      const { data: bestAsk } = await supabase
        .from('marketplace_orders')
        .select('price_per_token')
        .eq('property_id', propertyId)
        .eq('order_type', 'sell')
        .in('status', ['open', 'partially_filled'])
        .order('price_per_token', { ascending: true })
        .limit(1)
        .single();

      // Get last trade price
      const { data: lastTrade } = await supabase
        .from('marketplace_trades')
        .select('price_per_token')
        .eq('property_id', propertyId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      const newStats = {
        property_id: propertyId,
        volume_24h: volume24h,
        trades_24h: trades24hCount,
        last_price: lastTrade?.price_per_token,
        best_bid: bestBid?.price_per_token,
        best_ask: bestAsk?.price_per_token,
        spread: bestBid && bestAsk ? bestAsk.price_per_token - bestBid.price_per_token : null
      };

      // Insert stats
      const { data: insertedStats } = await supabase
        .from('marketplace_statistics')
        .insert(newStats)
        .select()
        .single();

      return NextResponse.json(
        { statistics: insertedStats || newStats },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { statistics: stats },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in GET /api/marketplace/statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

