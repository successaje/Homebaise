import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CreateInvestmentInput, Investment } from '@/types/investment';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/investments - Get investments for a user or property
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const investorId = searchParams.get('investor_id');
    const propertyId = searchParams.get('property_id');
    const status = searchParams.get('status');

    let query = supabase
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
      .order('created_at', { ascending: false });

    if (investorId) {
      query = query.eq('investor_id', investorId);
    }

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching investments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch investments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ investments: data });
  } catch (error) {
    console.error('Error in GET /api/investments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/investments - Create a new investment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      property_id, 
      amount, 
      tokens_purchased, 
      token_price, 
      transaction_hash,
      payment_method 
    } = body;

    // Validate required fields
    if (!property_id || !amount || !tokens_purchased || !token_price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Check if property exists and is available for investment
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', property_id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    if (property.status !== 'active' && property.status !== 'tokenized') {
      return NextResponse.json(
        { error: 'Property is not available for investment' },
        { status: 400 }
      );
    }

    // Validate investment amount
    if (amount < (property.min_investment || 0)) {
      return NextResponse.json(
        { error: `Minimum investment is ${property.min_investment}` },
        { status: 400 }
      );
    }

    if (property.max_investment && amount > property.max_investment) {
      return NextResponse.json(
        { error: `Maximum investment is ${property.max_investment}` },
        { status: 400 }
      );
    }

    // Check available tokens
    const { data: investmentDetails } = await supabase
      .from('property_treasury_accounts')
      .select('token_balance')
      .eq('property_id', property_id)
      .single();

    if (investmentDetails && tokens_purchased > investmentDetails.token_balance) {
      return NextResponse.json(
        { error: 'Insufficient tokens available' },
        { status: 400 }
      );
    }

    // Create investment record
    const investmentData: CreateInvestmentInput = {
      property_id,
      amount,
      tokens_purchased,
      token_price,
      transaction_hash,
      status: 'pending'
    };

    const { data: investment, error: investmentError } = await supabase
      .from('investments')
      .insert({
        ...investmentData,
        investor_id: user.id
      })
      .select()
      .single();

    if (investmentError) {
      console.error('Error creating investment:', investmentError);
      return NextResponse.json(
        { error: 'Failed to create investment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      investment,
      message: 'Investment created successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/investments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
