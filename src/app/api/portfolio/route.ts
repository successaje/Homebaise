import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { InvestorPortfolioItem } from '@/types/investment';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from the session
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the session token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to fetch from investor_portfolio view first
    let portfolio: InvestorPortfolioItem[] = [];
    let summary = {
      totalInvested: 0,
      totalTokens: 0,
      totalEarnings: 0,
      activeInvestments: 0,
      completedInvestments: 0
    };

    const { data: portfolioData, error: portfolioError } = await supabase
      .from('investor_portfolio')
      .select('*')
      .eq('investor_id', user.id);

    if (!portfolioError && portfolioData) {
      portfolio = portfolioData;
      
      // Calculate summary from portfolio data
      summary = portfolio.reduce((acc, item) => {
        acc.totalInvested += item.total_invested || 0;
        acc.totalTokens += item.total_tokens || 0;
        acc.totalEarnings += item.total_earnings || 0;
        acc.activeInvestments += item.property_status === 'active' ? 1 : 0;
        acc.completedInvestments += item.number_of_investments || 0;
        return acc;
      }, {
        totalInvested: 0,
        totalTokens: 0,
        totalEarnings: 0,
        activeInvestments: 0,
        completedInvestments: 0
      });
    } else {
      // Fallback: fetch from investments table if investor_portfolio view doesn't exist
      console.warn('investor_portfolio view not found, falling back to investments table');
      
      const { data: investments, error: investmentsError } = await supabase
        .from('investments')
        .select(`
          *,
          properties (
            id,
            name,
            title
          )
        `)
        .eq('investor_id', user.id)
        .eq('status', 'completed');

      if (investmentsError) {
        console.error('Error fetching investments:', investmentsError);
      } else if (investments && investments.length > 0) {
        // Group investments by property
        interface PropertyInvestment {
          investor_id: string;
          investor_email: string;
          property_id: string;
          property_name: string;
          property_status: string;
          total_tokens: number;
          total_invested: number;
          average_token_price: number;
          number_of_investments: number;
          last_investment_date: string | null;
          total_earnings: number;
        }
        
        const propertyMap = new Map<string, PropertyInvestment>();
        
        investments.forEach((inv: { property_id: string; tokens_purchased: number; amount: number; created_at: string; properties?: { name?: string; title?: string; status?: string } }) => {
          const propId = inv.property_id;
          if (!propertyMap.has(propId)) {
            propertyMap.set(propId, {
              investor_id: user.id,
              investor_email: user.email || '',
              property_id: propId,
              property_name: inv.properties?.name || inv.properties?.title || 'Unknown Property',
              property_status: inv.properties?.status || 'active',
              total_tokens: 0,
              total_invested: 0,
              average_token_price: 0,
              number_of_investments: 0,
              last_investment_date: null,
              total_earnings: 0
            });
          }
          
          const item = propertyMap.get(propId);
          if (item) {
            item.total_tokens += inv.tokens_purchased || 0;
            item.total_invested += inv.amount || 0;
            item.number_of_investments += 1;
            
            if (!item.last_investment_date || new Date(inv.created_at) > new Date(item.last_investment_date)) {
              item.last_investment_date = inv.created_at;
            }
          }
        });
        
        portfolio = Array.from(propertyMap.values());
        
        // Recalculate with proper averages
        portfolio = portfolio.map(item => ({
          ...item,
          average_token_price: item.total_invested / item.total_tokens || 0
        }));
        
        // Calculate summary
        summary = portfolio.reduce((acc, item) => {
          acc.totalInvested += item.total_invested || 0;
          acc.totalTokens += item.total_tokens || 0;
          acc.totalEarnings += item.total_earnings || 0;
          acc.activeInvestments += item.property_status === 'active' ? 1 : 0;
          acc.completedInvestments += item.number_of_investments || 0;
          return acc;
        }, {
          totalInvested: 0,
          totalTokens: 0,
          totalEarnings: 0,
          activeInvestments: 0,
          completedInvestments: 0
        });
      }
    }

    return NextResponse.json({
      portfolio,
      summary
    });
  } catch (error) {
    console.error('Portfolio API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}