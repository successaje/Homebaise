import axios from 'axios';
import { config } from './config';

const apiClient = axios.create({
  baseURL: config.api.url,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API response types
export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  returns: number;
  properties: Array<{
    id: string;
    name: string;
    investment: number;
    tokens: number;
    fundedPercent: number;
  }>;
}

export interface WalletBalance {
  hbarBalance: number;
  usdValue: number;
  recentActivity: Array<{
    type: string;
    amount: number;
    timestamp: string;
  }>;
}

export interface Property {
  id: string;
  name: string;
  location: string;
  totalValue: number;
  fundedPercent: number;
  yieldRate: number;
  availableFunding: number;
}

// API functions
export async function getUserPortfolio(userId: string, token: string): Promise<PortfolioSummary | null> {
  try {
    const response = await apiClient.get(`/api/portfolio`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return null;
  }
}

export async function getWalletBalance(userId: string, token: string): Promise<WalletBalance | null> {
  try {
    // This would need to be implemented in the API
    const response = await apiClient.get(`/api/wallet/balance`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return null;
  }
}

export async function getProperties(token: string): Promise<Property[] | null> {
  try {
    const response = await apiClient.get(`/api/properties`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching properties:', error);
    return null;
  }
}

export async function createInvestment(
  propertyId: string,
  amount: number,
  token: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    const response = await apiClient.post(
      `/api/investments`,
      { property_id: propertyId, amount },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return { success: true, transactionId: response.data.transaction_hash };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

