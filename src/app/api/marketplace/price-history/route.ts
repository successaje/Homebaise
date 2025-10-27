import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TimeInterval } from '@/types/marketplace';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Generate mock price history data
function generateMockPriceHistory(propertyId: string, interval: TimeInterval, limit: number) {
  const basePrice = {
    'mock-1': 50.0,  // Lagos
    'mock-2': 75.0,  // Nairobi
    'mock-3': 94.0,  // Cape Town
    'mock-4': 36.0,  // Accra
    'mock-5': 26.0,  // Kigali
    'mock-6': 56.0   // DSM
  }[propertyId] || 50.0;

  const volatility = 0.02; // 2% volatility
  const trend = {
    'mock-1': 0.001,   // Slight uptrend
    'mock-2': 0.0008,  // Slight uptrend
    'mock-3': -0.0003, // Slight downtrend
    'mock-4': 0.0015,  // Stronger uptrend
    'mock-5': 0.0005,  // Slight uptrend
    'mock-6': 0.001    // Slight uptrend
  }[propertyId] || 0;

  const intervalMs = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
    '1M': 30 * 24 * 60 * 60 * 1000
  }[interval] || 60 * 60 * 1000;

  const data = [];
  let currentPrice = basePrice;
  const now = Date.now();

  for (let i = limit - 1; i >= 0; i--) {
    const timestamp = now - (i * intervalMs);
    
    // Generate OHLC with some randomness
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    const trendChange = trend * currentPrice;
    
    const open = currentPrice;
    const close = currentPrice + change + trendChange;
    const high = Math.max(open, close) + Math.random() * volatility * currentPrice;
    const low = Math.min(open, close) - Math.random() * volatility * currentPrice;
    const volume = Math.floor(Math.random() * 500) + 100;

    data.push({
      timestamp,
      time: Math.floor(timestamp / 1000),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });

    currentPrice = close;
  }

  return data;
}

// GET /api/marketplace/price-history - Get price history for charting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');
    const interval = (searchParams.get('interval') || '1h') as TimeInterval;
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'property_id is required' },
        { status: 400 }
      );
    }

    // Return mock data for demo properties
    if (propertyId.startsWith('mock-')) {
      const mockData = generateMockPriceHistory(propertyId, interval, limit);
      return NextResponse.json(
        {
          data: mockData,
          interval,
          count: mockData.length
        },
        { status: 200 }
      );
    }

    const { data: priceHistory, error } = await supabase
      .from('marketplace_price_history')
      .select('*')
      .eq('property_id', propertyId)
      .eq('interval', interval)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching price history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch price history' },
        { status: 500 }
      );
    }

    // Convert to chart-friendly format and reverse (oldest first)
    const chartData = (priceHistory || [])
      .reverse()
      .map(item => ({
        timestamp: new Date(item.timestamp).getTime(),
        time: new Date(item.timestamp).getTime() / 1000, // Unix timestamp in seconds
        open: parseFloat(item.open_price.toString()),
        high: parseFloat(item.high_price.toString()),
        low: parseFloat(item.low_price.toString()),
        close: parseFloat(item.close_price.toString()),
        volume: parseInt(item.volume.toString())
      }));

    return NextResponse.json(
      {
        data: chartData,
        interval,
        count: chartData.length
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in GET /api/marketplace/price-history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

