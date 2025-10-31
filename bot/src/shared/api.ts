import axios from 'axios';
import { config } from './config';
import * as dns from 'dns';

// Set DNS to prefer IPv4 for better connectivity
dns.setDefaultResultOrder('ipv4first');

const apiClient = axios.create({
  baseURL: config.api.url,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'HomebaiseBot/1.0',
  },
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.config?.url);
    return Promise.reject(error);
  }
);

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
  property_type: string;
  description: string;
}

// API functions
export async function getUserPortfolio(userId: string, token: string): Promise<PortfolioSummary | null> {
  try {
    const response = await apiClient.get(`/api/portfolio?userId=${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.portfolio || response.data;
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    
    // Return mock data for demo purposes
    return {
      totalInvested: 0,
      currentValue: 0,
      returns: 0,
      properties: []
    };
  }
}

export async function getWalletBalance(userId: string, token: string): Promise<WalletBalance | null> {
  try {
    const response = await apiClient.get(`/api/wallet/balance?userId=${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.balance || response.data;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    
    // Return mock data for demo purposes
    return {
      hbarBalance: 0,
      usdValue: 0,
      recentActivity: []
    };
  }
}

export async function getProperties(token: string): Promise<Property[] | null> {
  try {
    const response = await apiClient.get(`/api/properties`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.properties || response.data || [];
  } catch (error) {
    console.error('Error fetching properties:', error);
    
    // Return mock data for demo purposes when API is not available
    return [
      {
        id: '1',
        name: 'Luxury Beachfront Villa',
        location: 'Dakar, Senegal',
        totalValue: 250000,
        fundedPercent: 75,
        yieldRate: 8.5,
        availableFunding: 62500,
        property_type: 'Residential',
        description: 'Premium beachfront property with stunning ocean views'
      },
      {
        id: '2',
        name: 'Coffee Plantation Estate',
        location: 'Mount Kenya, Kenya',
        totalValue: 180000,
        fundedPercent: 45,
        yieldRate: 12,
        availableFunding: 99000,
        property_type: 'Agricultural',
        description: 'High-yield coffee plantation with modern processing facilities'
      },
      {
        id: '3',
        name: 'Urban Development Complex',
        location: 'Lagos, Nigeria',
        totalValue: 320000,
        fundedPercent: 92,
        yieldRate: 9.2,
        availableFunding: 25600,
        property_type: 'Commercial',
        description: 'Mixed-use development in prime Lagos location'
      }
    ];
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

// Signed server call: invest by title (preferred for bot)
export async function createInvestmentByTitle(
  title: string,
  amountUsd: number,
  userId?: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    const response = await apiClient.post(
      `/api/bot/invest`,
      { title, amountUsd, userId },
      {
        headers: {
          'X-Bot-Token': config.bot.serverToken,
          'Content-Type': 'application/json',
        },
      }
    );
    const tx = response.data?.transaction_hash as string | undefined;
    return { success: true, transactionId: tx };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

