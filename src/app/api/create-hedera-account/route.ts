import { NextRequest, NextResponse } from 'next/server';
import { createHederaAccount } from '@/lib/hedera';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Hedera account
    const accountResult = await createHederaAccount();

    // Update user profile with the new account details
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        wallet_address: accountResult.accountId,
        hedera_evm_address: accountResult.evmAddress,
        hedera_private_key: accountResult.privateKey, // Note: In production, this should be encrypted
        hedera_public_key: accountResult.publicKey
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      account: {
        accountId: accountResult.accountId,
        evmAddress: accountResult.evmAddress,
        balance: accountResult.balance
      }
    });

  } catch (error) {
    console.error('Error creating Hedera account:', error);
    const message = error instanceof Error ? error.message : 'Failed to create Hedera account';
    return NextResponse.json(
      { error: message }, 
      { status: 500 }
    );
  }
} 