export interface Investment {
  id: string;
  property_id: string;
  investor_id: string;
  amount: number;
  tokens_purchased: number;
  token_price: number;
  transaction_hash?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // Relations (will be joined in queries)
  property?: {
    name: string;
    token_symbol?: string;
  };
}

export interface PropertyInvestmentDetails {
  id: string;
  property_id: string;
  total_tokens: number;
  tokens_available: number;
  tokens_sold: number;
  funding_goal: number;
  amount_raised: number;
  funding_progress: number;
  min_investment: number;
  max_investment: number | null;
  token_price: number;
  yield_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface InvestmentDistribution {
  id: string;
  property_id: string;
  distribution_date: string;
  amount_per_token: number;
  total_amount: number;
  period_start: string;
  period_end: string;
  description?: string;
  created_at: string;
}

export interface InvestorEarning {
  id: string;
  investment_id: string;
  distribution_id: string;
  investor_id: string;
  tokens_owned_at_distribution: number;
  snapshot_balance: number;
  amount_earned: number;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations (will be joined in queries)
  distribution?: InvestmentDistribution;
  property?: {
    name: string;
    token_symbol?: string;
  };
}

export interface InvestmentSummary {
  property_id: string;
  property_name: string;
  status: string;
  total_tokens: number;
  tokens_available: number;
  tokens_sold: number;
  funding_goal: number;
  amount_raised: number;
  funding_progress: number;
  token_price: number;
  yield_rate: number | null;
  total_investors: number;
  total_investments: number;
  last_investment_date: string | null;
  property_created_at: string;
  property_updated_at: string;
}

export interface CreateInvestmentInput {
  property_id: string;
  amount: number;
  tokens_purchased: number;
  token_price: number;
  transaction_hash?: string;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
}

export interface CreateDistributionInput {
  property_id: string;
  distribution_date: string;
  amount_per_token: number;
  period_start: string;
  period_end: string;
  description?: string;
}

export interface InvestorPortfolioItem {
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

export interface InvestmentPerformance {
  investment_id: string;
  property_id: string;
  property_name: string;
  investor_id: string;
  investor_email: string;
  invested_amount: number;
  tokens_purchased: number;
  token_price: number;
  investment_date: string;
  distributions_received: number;
  total_earnings: number;
  roi_percentage: number;
  property_status: string;
}

export interface UpdateInvestmentInput {
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  transaction_hash?: string;
  completed_at?: string;
}
