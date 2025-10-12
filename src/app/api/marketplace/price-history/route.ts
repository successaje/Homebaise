import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TimeInterval } from '@/types/marketplace';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

