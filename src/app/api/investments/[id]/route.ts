import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UpdateInvestmentInput } from '@/types/investment';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/investments/[id] - Get a specific investment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: investment, error } = await supabase
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
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching investment:', error);
      return NextResponse.json(
        { error: 'Investment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ investment });
  } catch (error) {
    console.error('Error in GET /api/investments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/investments/[id] - Update an investment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updateData: UpdateInvestmentInput = body;

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
    const { data: existingInvestment, error: fetchError } = await supabase
      .from('investments')
      .select('*')
      .eq('id', id)
      .eq('investor_id', user.id)
      .single();

    if (fetchError || !existingInvestment) {
      return NextResponse.json(
        { error: 'Investment not found or access denied' },
        { status: 404 }
      );
    }

    // Only allow certain status updates
    if (updateData.status && !['pending', 'completed', 'failed', 'cancelled'].includes(updateData.status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // If completing the investment, set completed_at
    if (updateData.status === 'completed' && existingInvestment.status !== 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: investment, error: updateError } = await supabase
      .from('investments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating investment:', updateError);
      return NextResponse.json(
        { error: 'Failed to update investment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      investment,
      message: 'Investment updated successfully' 
    });

  } catch (error) {
    console.error('Error in PUT /api/investments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/investments/[id] - Cancel an investment (only if pending)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const { data: existingInvestment, error: fetchError } = await supabase
      .from('investments')
      .select('*')
      .eq('id', id)
      .eq('investor_id', user.id)
      .single();

    if (fetchError || !existingInvestment) {
      return NextResponse.json(
        { error: 'Investment not found or access denied' },
        { status: 404 }
      );
    }

    // Only allow cancellation of pending investments
    if (existingInvestment.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending investments can be cancelled' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('investments')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (updateError) {
      console.error('Error cancelling investment:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel investment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Investment cancelled successfully' 
    });

  } catch (error) {
    console.error('Error in DELETE /api/investments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
