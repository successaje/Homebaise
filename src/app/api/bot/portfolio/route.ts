import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type PortfolioViewRow = {
  investor_id?: string | null;
  property_id?: string | null;
  property_name?: string | null;
  property_status?: string | null;
  total_tokens?: number | null;
  total_invested?: number | null;
  total_earnings?: number | null;
  number_of_investments?: number | null;
  last_investment_date?: string | null;
  propertyName?: string | null;
  propertyStatus?: string | null;
  totalTokens?: number | null;
  totalInvested?: number | null;
  totalEarnings?: number | null;
  completedInvestments?: number | null;
  lastInvestmentDate?: string | null;
};

type InvestmentRow = {
  property_id: string | null;
  tokens_purchased?: number | null;
  amount?: number | null;
  created_at?: string | null;
  status?: string | null;
  properties?: {
    id?: string | null;
    name?: string | null;
    title?: string | null;
    status?: string | null;
  } | null;
};

type PortfolioRow = {
  investor_id: string;
  property_id: string;
  property_name: string;
  property_status: string;
  total_tokens: number;
  total_invested: number;
  total_earnings: number;
  number_of_investments: number;
  last_investment_date: string | null;
};

function normalizePortfolioRow(userId: string, row: PortfolioViewRow): PortfolioRow {
  return {
    investor_id: row.investor_id ?? userId,
    property_id: row.property_id ?? 'unknown',
    property_name: row.property_name ?? row.propertyName ?? 'Unknown Property',
    property_status: row.property_status ?? row.propertyStatus ?? 'active',
    total_tokens: Number(row.total_tokens ?? row.totalTokens ?? 0),
    total_invested: Number(row.total_invested ?? row.totalInvested ?? 0),
    total_earnings: Number(row.total_earnings ?? row.totalEarnings ?? 0),
    number_of_investments: Number(row.number_of_investments ?? row.completedInvestments ?? 0),
    last_investment_date: row.last_investment_date ?? row.lastInvestmentDate ?? null,
  };
}

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

    let portfolio: PortfolioRow[] = (portfolioView as PortfolioViewRow[] | null)?.map((row) =>
      normalizePortfolioRow(userId, row)
    ) ?? [];

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

      const propertyMap = new Map<string, PortfolioRow>();
      (investments as InvestmentRow[] | null)?.forEach((inv) => {
        const propertyId = inv.property_id ?? undefined;
        if (!propertyId) return;

        if (!propertyMap.has(propertyId)) {
          propertyMap.set(propertyId, {
            investor_id: userId,
            property_id: propertyId,
            property_name:
              inv.properties?.name ??
              inv.properties?.title ??
              'Unknown Property',
            property_status: inv.properties?.status ?? inv.status ?? 'active',
            total_tokens: 0,
            total_invested: 0,
            total_earnings: 0,
            number_of_investments: 0,
            last_investment_date: null,
          });
        }

        const item = propertyMap.get(propertyId)!;
        item.total_tokens += Number(inv.tokens_purchased ?? 0);
        item.total_invested += Number(inv.amount ?? 0);
        item.number_of_investments += 1;
        if (
          inv.created_at &&
          (!item.last_investment_date || new Date(inv.created_at) > new Date(item.last_investment_date))
        ) {
          item.last_investment_date = inv.created_at;
        }
      });

      portfolio = Array.from(propertyMap.values());
    }

    portfolio.forEach((item) => {
      summary.totalInvested += item.total_invested;
      summary.totalTokens += item.total_tokens;
      summary.totalEarnings += item.total_earnings;
      const status = item.property_status || 'active';
      summary.activeInvestments += status === 'active' ? 1 : 0;
      summary.completedInvestments += item.number_of_investments;
    });

    return NextResponse.json({ portfolio, summary });
  } catch (error) {
    console.error('bot/portfolio error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
