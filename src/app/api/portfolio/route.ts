import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params or headers
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's investments
    const { data: investments, error: investmentsError } = await supabase
      .from('investments')
      .select(`
        *,
        properties (
          id,
          name,
          title,
          location,
          total_value,
          property_type,
          yield_rate
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (investmentsError) {
      console.error('Error fetching investments:', investmentsError);
      return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
    }

    // Calculate portfolio summary
    const totalInvested = investments?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
    const totalTokens = investments?.reduce((sum, inv) => sum + (inv.tokens_purchased || 0), 0) || 0;
    const propertyCount = new Set(investments?.map(inv => inv.property_id)).size;

    const portfolio = {
      investments: investments || [],
      summary: {
        totalInvested,
        totalTokens,
        propertyCount,
        investmentCount: investments?.length || 0
      }
    };

    return NextResponse.json({ portfolio });
  } catch (error) {
    console.error('Portfolio API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}