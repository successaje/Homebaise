import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { executePropertyInvestment } from '@/lib/investment-flow';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/investments/execute - Execute a property investment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { property_id, amount } = body;

    // Validate required fields
    if (!property_id || !amount) {
      return NextResponse.json(
        { error: 'property_id and amount are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Investment amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Get the current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Check if user has KYC verification
    const { data: profile } = await supabase
      .from('profiles')
      .select('kyc_status')
      .eq('id', user.id)
      .single();

    if (!profile || profile.kyc_status !== 'verified') {
      return NextResponse.json(
        { error: 'KYC verification is required to invest' },
        { status: 400 }
      );
    }

    // Execute the investment flow
    const result = await executePropertyInvestment(
      property_id,
      user.id,
      amount
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      investment: result.investment,
      transactionHash: result.transactionHash,
      message: 'Investment completed successfully'
    });

  } catch (error: any) {
    console.error('Error in POST /api/investments/execute:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
