import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { InvestorPortfolioItem } from '@/types/investment';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/portfolio - Get investor portfolio
export async function GET(request: NextRequest) {
  try {
    // Get the current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Get portfolio data from the view
    const { data: portfolio, error } = await supabase
      .from('investor_portfolio')
      .select('*')
      .eq('investor_id', user.id)
      .order('last_investment_date', { ascending: false });

    if (error) {
      console.error('Error fetching portfolio:', error);
      return NextResponse.json(
        { error: 'Failed to fetch portfolio' },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const summary = portfolio?.reduce((acc, item) => {
      acc.totalInvested += item.total_invested;
      acc.totalTokens += item.total_tokens;
      acc.totalEarnings += item.total_earnings;
      acc.activeInvestments += item.property_status === 'active' ? 1 : 0;
      acc.completedInvestments += item.number_of_investments;
      return acc;
    }, {
      totalInvested: 0,
      totalTokens: 0,
      totalEarnings: 0,
      activeInvestments: 0,
      completedInvestments: 0
    }) || {
      totalInvested: 0,
      totalTokens: 0,
      totalEarnings: 0,
      activeInvestments: 0,
      completedInvestments: 0
    };

    return NextResponse.json({ 
      portfolio: portfolio || [],
      summary
    });

  } catch (error) {
    console.error('Error in GET /api/portfolio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
