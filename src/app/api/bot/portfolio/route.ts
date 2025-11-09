import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-bot-token') || request.headers.get('X-Bot-Token');
    if (!token || token !== process.env.BOT_SERVER_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json().catch(() => ({}));
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const summary = {
      totalInvested: 0,
      totalTokens: 0,
      totalEarnings: 0,
      activeInvestments: 0,
      completedInvestments: 0,
    };

    const { data: portfolioView, error: viewError } = await supabase
      .from('investor_portfolio')
      .select('*')
      .eq('investor_id', userId);

    let portfolio = portfolioView || [];

    if (viewError && viewError.code !== 'PGRST116') {
      console.error('bot/portfolio view error:', viewError);
    }

    if (!portfolio.length) {
      const { data: investments, error: investmentsError } = await supabase
        .from('investments')
        .select(
          `property_id, tokens_purchased, amount, created_at, status,
           properties ( id, name, title, status )`
        )
        .eq('investor_id', userId);

      if (investmentsError) {
        console.error('bot/portfolio investments error:', investmentsError);
        return NextResponse.json({ portfolio: [], summary });
      }

      const propertyMap = new Map<string, any>();
      (investments || []).forEach((inv) => {
        const propertyId = inv.property_id;
        if (!propertyId) return;

        if (!propertyMap.has(propertyId)) {
          propertyMap.set(propertyId, {
            investor_id: userId,
            property_id: propertyId,
            property_name: inv.properties?.name || inv.properties?.title || 'Unknown Property',
            property_status: inv.properties?.status || inv.status || 'active',
            total_tokens: 0,
            total_invested: 0,
            total_earnings: 0,
            number_of_investments: 0,
            last_investment_date: null,
          });
        }

        const item = propertyMap.get(propertyId);
        item.total_tokens += inv.tokens_purchased || 0;
        item.total_invested += inv.amount || 0;
        item.number_of_investments += 1;
        if (!item.last_investment_date || new Date(inv.created_at) > new Date(item.last_investment_date)) {
          item.last_investment_date = inv.created_at;
        }
      });

      portfolio = Array.from(propertyMap.values());
    }

    portfolio.forEach((item: any) => {
      summary.totalInvested += item.total_invested || item.totalInvested || 0;
      summary.totalTokens += item.total_tokens || item.totalTokens || 0;
      summary.totalEarnings += item.total_earnings || item.totalEarnings || 0;
      const status = item.property_status || item.propertyStatus || 'active';
      summary.activeInvestments += status === 'active' ? 1 : 0;
      summary.completedInvestments += item.number_of_investments || item.completedInvestments || 0;
    });

    return NextResponse.json({ portfolio, summary });
  } catch (error) {
    console.error('bot/portfolio error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
