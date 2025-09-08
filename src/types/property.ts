// Unified Property interface for consistent usage across components
export interface Property {
  // Core identification
  id: string;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  
  // Location information
  location?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  
  // Property details
  property_type?: string | null;
  total_value?: number | null;
  status: string;
  
  // Investment details
  token_price?: number | null;
  min_investment?: number | null;
  max_investment?: number | null;
  funded_amount_usd?: number | null;
  funded_percent?: number | null;
  yield_rate?: string | null;
  
  // Token information
  token_id?: string | null;
  token_symbol?: string | null;
  token_name?: string | null;
  token_decimals?: number | null;
  token_type?: 'FUNGIBLE' | 'NON_FUNGIBLE' | null;
  
  // Treasury information
  treasury_account_id?: string | null;
  treasury_private_key?: string | null;
  
  // Certificate information
  certificate_id?: string | null;
  certificate_token_id?: string | null;
  certificate_number?: string | null;
  certificate_metadata_url?: string | null;
  certificate_issued_at?: string | null;
  
  // Media
  images?: string[] | null;
  ipfs_image_cids?: string[] | null;
  
  // Property features and details
  investment_highlights?: string[] | null;
  property_features?: string[] | null;
  amenities?: string[] | null;
  investment_risks?: string[] | null;
  
  // Property details object
  property_details?: {
    size?: string;
    legal_status?: string;
    occupancy_rate?: string;
    annual_rental_income?: string;
    appreciation_rate?: string;
  } | null;
  
  // Management
  property_manager?: string | null;
  listed_by: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Computed fields (from database views)
  tokens_available?: number | null;
  tokens_sold?: number | null;
  total_tokens?: number | null;
  funding_progress?: number | null;
  
  // Legacy fields for backward compatibility
  is_tokenized?: boolean;
}

// Property creation input
export interface CreatePropertyInput {
  name?: string;
  title?: string;
  description?: string;
  location?: string;
  country?: string;
  city?: string;
  address?: string;
  property_type?: string;
  total_value?: number;
  token_price?: number;
  min_investment?: number;
  max_investment?: number;
  yield_rate?: string;
  images?: string[];
  ipfs_image_cids?: string[];
  investment_highlights?: string[];
  property_features?: string[];
  amenities?: string[];
  investment_risks?: string[];
  property_details?: {
    size?: string;
    legal_status?: string;
    occupancy_rate?: string;
    annual_rental_income?: string;
    appreciation_rate?: string;
  };
  property_manager?: string;
  listed_by: string;
}

// Property update input
export interface UpdatePropertyInput {
  name?: string;
  title?: string;
  description?: string;
  location?: string;
  country?: string;
  city?: string;
  address?: string;
  property_type?: string;
  total_value?: number;
  token_price?: number;
  min_investment?: number;
  max_investment?: number;
  yield_rate?: string;
  status?: string;
  images?: string[];
  ipfs_image_cids?: string[];
  investment_highlights?: string[];
  property_features?: string[];
  amenities?: string[];
  investment_risks?: string[];
  property_details?: {
    size?: string;
    legal_status?: string;
    occupancy_rate?: string;
    annual_rental_income?: string;
    appreciation_rate?: string;
  };
  property_manager?: string;
  certificate_id?: string;
  certificate_token_id?: string;
  certificate_number?: string;
  certificate_metadata_url?: string;
  certificate_issued_at?: string;
  token_id?: string;
  token_symbol?: string;
  token_name?: string;
  token_decimals?: number;
  token_type?: 'FUNGIBLE' | 'NON_FUNGIBLE';
  treasury_account_id?: string;
  treasury_private_key?: string;
}

// Property with investment details (joined with property_investment_details)
export interface PropertyWithInvestmentDetails extends Property {
  investment_details?: {
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
  };
}

// Property list item (minimal data for listings)
export interface PropertyListItem {
  id: string;
  name?: string | null;
  title?: string | null;
  location?: string | null;
  property_type?: string | null;
  total_value?: number | null;
  funded_percent?: number | null;
  yield_rate?: string | null;
  status: string;
  images?: string[] | null;
  ipfs_image_cids?: string[] | null;
  token_price?: number | null;
  min_investment?: number | null;
  max_investment?: number | null;
  created_at: string;
  updated_at: string;
}
