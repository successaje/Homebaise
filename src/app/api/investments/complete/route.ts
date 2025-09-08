import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/investments/complete - Complete an investment after payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { investment_id, transaction_hash, payment_method } = body;

    // Validate required fields
    if (!investment_id) {
      return NextResponse.json(
        { error: 'Investment ID is required' },
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

    // Check if investment exists and user owns it
    const { data: investment, error: fetchError } = await supabase
      .from('investments')
      .select('*')
      .eq('id', investment_id)
      .eq('investor_id', user.id)
      .single();

    if (fetchError || !investment) {
      return NextResponse.json(
        { error: 'Investment not found or access denied' },
        { status: 404 }
      );
    }

    // Only allow completion of pending investments
    if (investment.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending investments can be completed' },
        { status: 400 }
      );
    }

    // Update investment status to completed
    const { data: updatedInvestment, error: updateError } = await supabase
      .from('investments')
      .update({
        status: 'completed',
        transaction_hash: transaction_hash || investment.transaction_hash,
        completed_at: new Date().toISOString()
      })
      .eq('id', investment_id)
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

    if (updateError) {
      console.error('Error completing investment:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete investment' },
        { status: 500 }
      );
    }

    // The database trigger will automatically update property_investment_details
    // when the investment status changes to 'completed'

    return NextResponse.json({ 
      investment: updatedInvestment,
      message: 'Investment completed successfully' 
    });

  } catch (error) {
    console.error('Error in POST /api/investments/complete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
