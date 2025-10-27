import { SupabaseClient } from '@supabase/supabase-js';

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          title?: string | null;
          name: string | null;
          description: string | null;
          location: string | null;
          property_type: string | null;
          total_value: number | null;
          funded_amount_usd: number | null;
          funded_percent: number | null;
          yield_rate: string | null;
          status: string;
          images: string[] | null;
          created_at: string;
          updated_at: string;
          token_id: string | null;
          token_symbol: string | null;
          token_name: string | null;
          token_decimals: number | null;
          token_type: 'FUNGIBLE' | 'NON_FUNGIBLE' | null;
          treasury_account_id: string | null;
          treasury_private_key: string | null;
          is_tokenized?: boolean;
        };
        Insert: {
          id?: string;
          title?: string | null;
          name?: string | null;
          description?: string | null;
          location?: string | null;
          property_type?: string | null;
          total_value?: number | null;
          funded_amount_usd?: number | null;
          funded_percent?: number | null;
          yield_rate?: string | null;
          status?: string;
          images?: string[] | null;
          created_at?: string;
          updated_at?: string;
          token_id?: string | null;
          token_symbol?: string | null;
          token_name?: string | null;
          token_decimals?: number | null;
          token_type?: 'FUNGIBLE' | 'NON_FUNGIBLE' | null;
          treasury_account_id?: string | null;
          treasury_private_key?: string | null;
          is_tokenized?: boolean;
        };
        Update: {
          id?: string;
          title?: string | null;
          name?: string | null;
          description?: string | null;
          location?: string | null;
          property_type?: string | null;
          total_value?: number | null;
          funded_amount_usd?: number | null;
          funded_percent?: number | null;
          yield_rate?: string | null;
          status?: string;
          images?: string[] | null;
          created_at?: string;
          updated_at?: string;
          token_id?: string | null;
          token_symbol?: string | null;
          token_name?: string | null;
          token_decimals?: number | null;
          token_type?: 'FUNGIBLE' | 'NON_FUNGIBLE' | null;
          treasury_account_id?: string | null;
          treasury_private_key?: string | null;
          is_tokenized?: boolean;
        };
      };
      property_treasury_accounts: {
        Row: {
          id: string;
          property_id: string;
          account_id: string;
          public_key: string;
          private_key: string;
          token_id: string;
          token_type: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          account_id: string;
          public_key: string;
          private_key: string;
          token_id: string;
          token_type: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          account_id?: string;
          public_key?: string;
          private_key?: string;
          token_id?: string;
          token_type?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      property_certificates: {
        Row: {
          id: string;
          property_id: string;
          certificate_token_id: string;
          certificate_number: string;
          certificate_issued_at: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          certificate_token_id: string;
          certificate_number: string;
          certificate_issued_at: string;
          status: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          certificate_token_id?: string;
          certificate_number?: string;
          certificate_issued_at?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type SupabaseClientType = SupabaseClient<Database>;
