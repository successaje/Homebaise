import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MarketplaceTradingService } from '@/lib/marketplace-trading';
import { CreateOrderInput } from '@/types/marketplace';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/marketplace/orders - Get user's orders or all orders for a property
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');

    const orders = await MarketplaceTradingService.getUserOrders(
      user.id,
      propertyId || undefined
    );

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/marketplace/orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const body = await request.json();
    const {
      property_id,
      token_id,
      order_type,
      token_amount,
      price_per_token,
      currency,
      expires_at,
      notes,
      is_public
    }: CreateOrderInput = body;

    // Validate required fields
    const missingFields = [];
    if (!property_id) missingFields.push('property_id');
    if (!token_id) missingFields.push('token_id');
    if (!order_type) missingFields.push('order_type');
    if (!token_amount) missingFields.push('token_amount');
    if (price_per_token === undefined || price_per_token === null) missingFields.push('price_per_token');
    
    if (missingFields.length > 0) {
      console.error('Missing fields in order creation:', missingFields, body);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    if (token_amount <= 0 || price_per_token <= 0) {
      return NextResponse.json(
        { error: 'Invalid amounts' },
        { status: 400 }
      );
    }

    // Create order
    const result = await MarketplaceTradingService.createOrder(user.id, {
      property_id,
      token_id,
      order_type,
      token_amount,
      price_per_token,
      currency,
      expires_at,
      notes,
      is_public
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { order: result.order, message: 'Order created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/marketplace/orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

