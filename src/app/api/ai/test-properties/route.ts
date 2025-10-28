import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/ai/test-properties - Test endpoint to check properties
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');

    if (propertyId) {
      // Test specific property
      const { data: property, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      return NextResponse.json({
        success: true,
        property_id: propertyId,
        property: property,
        error: error,
        found: !!property
      });
    } else {
      // List all properties
      const { data: properties, error } = await supabase
        .from('properties')
        .select('id, name, location, property_type, total_value, status')
        .order('created_at', { ascending: false })
        .limit(10);

      return NextResponse.json({
        success: true,
        properties: properties,
        error: error,
        count: properties?.length || 0
      });
    }
    } catch (error: unknown) {
    console.error('Error in test-properties:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

