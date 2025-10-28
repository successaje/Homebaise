import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { InvestmentSummary } from '@/types/investment';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/properties/[id]/investment-summary - Get property investment summary
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const propertyId = id;

    // Get investment summary from the view
    const { data: summary, error } = await supabase
      .from('property_investment_overview')
      .select('*')
      .eq('property_id', propertyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found - return empty summary
        return NextResponse.json({
          property_id: propertyId,
          property_name: null,
          status: null,
          total_tokens: 0,
          tokens_available: 0,
          tokens_sold: 0,
          funding_goal: 0,
          amount_raised: 0,
          funding_progress: 0,
          token_price: 1, // 1:1 ratio
          yield_rate: null,
          total_investors: 0,
          total_investments: 0,
          last_investment_date: null,
          property_created_at: null,
          property_updated_at: null
        });
      }
      
      console.error('Error fetching investment summary:', error);
      return NextResponse.json(
        { error: 'Failed to fetch investment summary' },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary });

  } catch (error) {
    console.error('Error in GET /api/properties/[id]/investment-summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
