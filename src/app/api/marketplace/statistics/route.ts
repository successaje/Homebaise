import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Mock statistics data
const MOCK_STATS: Record<string, any> = {
  'mock-1': {
    property_id: 'mock-1',
    volume_24h: 45000,
    trades_24h: 23,
    high_24h: 52.50,
    low_24h: 48.20,
    change_24h: 5.2,
    volume_7d: 180000,
    trades_7d: 89,
    total_volume: 850000,
    total_trades: 340,
    last_price: 51.75,
    best_bid: 51.50,
    best_ask: 52.00,
    spread: 0.50,
    total_buy_orders: 12,
    total_sell_orders: 8,
    buy_order_volume: 15000,
    sell_order_volume: 12000,
    updated_at: new Date().toISOString()
  },
  'mock-2': {
    property_id: 'mock-2',
    volume_24h: 67000,
    trades_24h: 34,
    high_24h: 78.90,
    low_24h: 74.10,
    change_24h: 3.8,
    last_price: 77.25,
    best_bid: 76.90,
    best_ask: 77.50,
    spread: 0.60,
    updated_at: new Date().toISOString()
  },
  'mock-3': {
    property_id: 'mock-3',
    volume_24h: 28000,
    trades_24h: 15,
    high_24h: 95.50,
    low_24h: 92.00,
    change_24h: -1.5,
    last_price: 93.20,
    best_bid: 92.80,
    best_ask: 93.60,
    spread: 0.80,
    updated_at: new Date().toISOString()
  },
  'mock-4': {
    property_id: 'mock-4',
    volume_24h: 52000,
    trades_24h: 28,
    high_24h: 38.50,
    low_24h: 35.80,
    change_24h: 6.2,
    last_price: 37.90,
    best_bid: 37.60,
    best_ask: 38.10,
    spread: 0.50,
    updated_at: new Date().toISOString()
  },
  'mock-5': {
    property_id: 'mock-5',
    volume_24h: 15000,
    trades_24h: 8,
    high_24h: 26.80,
    low_24h: 25.20,
    change_24h: 2.1,
    last_price: 26.30,
    best_bid: 26.00,
    best_ask: 26.50,
    spread: 0.50,
    updated_at: new Date().toISOString()
  },
  'mock-6': {
    property_id: 'mock-6',
    volume_24h: 38000,
    trades_24h: 19,
    high_24h: 58.20,
    low_24h: 55.50,
    change_24h: 4.1,
    last_price: 57.60,
    best_bid: 57.20,
    best_ask: 57.90,
    spread: 0.70,
    updated_at: new Date().toISOString()
  }
};

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

    // Return mock data for demo properties
    if (propertyId.startsWith('mock-') && MOCK_STATS[propertyId]) {
      return NextResponse.json(
        { statistics: MOCK_STATS[propertyId] },
        { status: 200 }
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

