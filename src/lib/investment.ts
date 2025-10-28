import { supabase } from './supabase';
import { CreateInvestmentInput, Investment, InvestmentSummary, InvestorPortfolioItem } from '@/types/investment';
import { Property } from '@/types/property';
import { getPropertyTokenBalance, getPropertyFungibleTokenBalance } from './hedera-treasury';
import { executePropertyInvestment } from './investment-flow';

export class InvestmentService {
  /**
   * Create a new investment
   */
  static async createInvestment(investmentData: CreateInvestmentInput): Promise<Investment> {
    const { data, error } = await supabase
      .from('investments')
      .insert(investmentData)
      .select(`
        *,
        property:properties(
          id,
          name,
          title,
          token_symbol,
          status
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create investment: ${error.message}`);
    }

    return data;
  }

  /**
   * Get investments for a specific user
   */
  static async getUserInvestments(userId: string, status?: string): Promise<Investment[]> {
    let query = supabase
      .from('investments')
      .select(`
        *,
        property:properties(
          id,
          name,
          title,
          token_symbol,
          status,
          images,
          ipfs_image_cids
        )
      `)
      .eq('investor_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch user investments: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get investments for a specific property
   */
  static async getPropertyInvestments(propertyId: string): Promise<Investment[]> {
    const { data, error } = await supabase
      .from('investments')
      .select(`
        *,
        property:properties(
          id,
          name,
          title,
          token_symbol,
          status
        )
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch property investments: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get investment summary for a property
   */
  static async getPropertyInvestmentSummary(propertyId: string): Promise<InvestmentSummary | null> {
    const { data, error } = await supabase
      .from('property_investment_overview')
      .select('*')
      .eq('property_id', propertyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        return null;
      }
      throw new Error(`Failed to fetch investment summary: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user's investment portfolio
   */
  static async getUserPortfolio(userId: string): Promise<InvestorPortfolioItem[]> {
    const { data, error } = await supabase
      .from('investor_portfolio')
      .select('*')
      .eq('investor_id', userId)
      .order('last_investment_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user portfolio: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update investment status
   */
  static async updateInvestmentStatus(
    investmentId: string, 
    status: 'pending' | 'completed' | 'failed' | 'cancelled',
    transactionHash?: string
  ): Promise<Investment> {
    const updateData: Record<string, unknown> = { status };
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }
    
    if (transactionHash) {
      updateData.transaction_hash = transactionHash;
    }

    const { data, error } = await supabase
      .from('investments')
      .update(updateData)
      .eq('id', investmentId)
      .select(`
        *,
        property:properties(
          id,
          name,
          title,
          token_symbol,
          status
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update investment: ${error.message}`);
    }

    return data;
  }

  /**
   * Get available tokens for a property from treasury account balance
   */
  static async getAvailableTokens(propertyId: string): Promise<number> {
    try {
      const balance = await getPropertyFungibleTokenBalance(propertyId);
      return balance || 0;
    } catch (error) {
      console.error('Error fetching available tokens from treasury:', error);
      return 0;
    }
  }

  /**
   * Get total tokens for a property (1:1 ratio with property value)
   */
  static async getTotalTokens(propertyId: string): Promise<number> {
    try {
      const { data: property, error } = await supabase
        .from('properties')
        .select('total_value')
        .eq('id', propertyId)
        .single();

      if (error || !property || !property.total_value) {
        return 0;
      }

      // 1:1 ratio - total tokens = property value
      return property.total_value;
    } catch (error) {
      console.error('Error fetching total tokens:', error);
      return 0;
    }
  }

  /**
   * Calculate tokens from investment amount (1:1 ratio)
   */
  static calculateTokens(amount: number): number {
    // 1:1 ratio - $1 = 1 token
    return amount;
  }

  /**
   * Calculate investment amount from tokens (1:1 ratio)
   */
  static calculateAmount(tokens: number): number {
    // 1:1 ratio - 1 token = $1
    return tokens; // An update might come later where the calculations is a little bit different and complex
    
  }

  /**
   * Validate investment amount against property constraints
   */
  static validateInvestment(
    amount: number,
    tokens: number,
    property: Property
  ): { valid: boolean; error?: string } {
    // Check global minimum investment (hard limit)
    if (amount < 10) {
      return {
        valid: false,
        error: 'Minimum investment is $10'
      };
    }

    // Check property-specific minimum investment
    if (property.min_investment && amount < property.min_investment) {
      return {
        valid: false,
        error: `Minimum investment is $${property.min_investment.toLocaleString()}`
      };
    }

    // Check maximum investment
    if (property.max_investment && amount > property.max_investment) {
      return {
        valid: false,
        error: `Maximum investment is $${property.max_investment.toLocaleString()}`
      };
    }

    // Check token calculation consistency (1:1 ratio)
    const expectedTokens = this.calculateTokens(amount);
    if (Math.abs(tokens - expectedTokens) > 0) { // Must be exact for 1:1 ratio
      return {
        valid: false,
        error: 'Token calculation mismatch - should be 1:1 ratio'
      };
    }

    // Check property status
    if (property.status !== 'active' && property.status !== 'tokenized') {
      return {
        valid: false,
        error: 'Property is not available for investment'
      };
    }

    return { valid: true };
  }

  /**
   * Get investment performance for a user
   */
  static async getInvestmentPerformance(userId: string): Promise<Record<string, unknown>[]> {
    const { data, error } = await supabase
      .from('investment_performance')
      .select('*')
      .eq('investor_id', userId)
      .order('investment_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch investment performance: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get total investment statistics for a user
   */
  static async getUserInvestmentStats(userId: string): Promise<{
    totalInvested: number;
    totalTokens: number;
    totalEarnings: number;
    activeInvestments: number;
    completedInvestments: number;
  }> {
    const portfolio = await this.getUserPortfolio(userId);
    
    const stats = portfolio.reduce((acc, item) => {
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
    });

    return stats;
  }

  /**
   * Execute complete investment flow with Hedera SDK
   */
  static async executeInvestment(
    propertyId: string,
    investorId: string,
    amount: number
  ): Promise<{
    success: boolean;
    investment?: Investment;
    transactionHash?: string;
    error?: string;
  }> {
    return await executePropertyInvestment(propertyId, investorId, amount);
  }

  /**
   * Fetch investor portfolio via API
   */
  static async fetchPortfolio(userId: string): Promise<{
    portfolio: InvestorPortfolioItem[];
    summary: {
      totalInvested: number;
      totalTokens: number;
      totalEarnings: number;
      activeInvestments: number;
      completedInvestments: number;
    };
  }> {
    try {
      const response = await fetch('/api/portfolio', {
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch portfolio: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      return {
        portfolio: [],
        summary: {
          totalInvested: 0,
          totalTokens: 0,
          totalEarnings: 0,
          activeInvestments: 0,
          completedInvestments: 0
        }
      };
    }
  }

  /**
   * Fetch property investment summary via API
   */
  static async fetchPropertyInvestmentSummary(propertyId: string): Promise<InvestmentSummary | null> {
    try {
      const response = await fetch(`/api/properties/${propertyId}/investment-summary`);

      if (!response.ok) {
        throw new Error(`Failed to fetch investment summary: ${response.statusText}`);
      }

      const data = await response.json();
      return data.summary;
    } catch (error) {
      console.error('Error fetching investment summary:', error);
      return null;
    }
  }

  /**
   * Get authentication token for API calls
   */
  private static async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  }
}
