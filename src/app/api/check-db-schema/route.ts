import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if property_treasury_accounts table exists
    const { data: treasuryTable, error: treasuryError } = await supabase
      .from('property_treasury_accounts')
      .select('*')
      .limit(1);
    
    // Check if required columns exist in properties table
    const { data: propertiesColumns, error: propertiesError } = await supabase
      .from('properties')
      .select('is_tokenized, token_id, token_type, token_symbol, token_name, token_decimals')
      .limit(1);
    
    // Check if property_certificates table exists
    const { data: certificatesTable, error: certificatesError } = await supabase
      .from('property_certificates')
      .select('*')
      .limit(1);
    
    const schemaStatus = {
      property_treasury_accounts: {
        exists: !treasuryError,
        error: treasuryError?.message || null
      },
      properties_columns: {
        exists: !propertiesError,
        error: propertiesError?.message || null,
        columns: propertiesColumns ? Object.keys(propertiesColumns[0] || {}) : []
      },
      property_certificates: {
        exists: !certificatesError,
        error: certificatesError?.message || null
      }
    };
    
    return NextResponse.json({
      success: true,
      schemaStatus,
      message: 'Database schema check completed'
    });
    
  } catch (error) {
    console.error('Error checking database schema:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `Failed to check database schema: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
