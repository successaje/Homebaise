import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MarketplaceTradingService } from '@/lib/marketplace-trading';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/marketplace/trades - Get recent trades
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('user_id');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'property_id is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('marketplace_trades')
      .select(`
        *,
        property:properties(id, name, token_symbol),
        buyer:profiles!buyer_id(id),
        seller:profiles!seller_id(id)
      `)
      .eq('property_id', propertyId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
    }

    const { data: trades, error } = await query;

    if (error) {
      console.error('Error fetching trades:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trades' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { trades: trades || [] },
      { status: 200 }
    );
    } catch (error: unknown) {
    console.error('Error in GET /api/marketplace/trades:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

