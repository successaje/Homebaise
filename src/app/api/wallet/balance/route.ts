import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params or headers
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's Hedera account balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'User profile not found', details: profileError }, { status: 404 });
    }

    // For users without Hedera accounts, return zero balance
    if (!profile?.hedera_account_id) {
      return NextResponse.json({ 
        balance: {
          hbar: 0.0,
          usd: 0.0,
          accountId: null,
          message: 'No Hedera account linked'
        }
      });
    }

    // For now, return a mock balance - in production, this would query Hedera
    const mockBalance = {
      hbar: 1000.0,
      usd: 1000.0,
      accountId: profile.hedera_account_id
    };

    return NextResponse.json({ balance: mockBalance });
  } catch (error) {
    console.error('Balance API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
