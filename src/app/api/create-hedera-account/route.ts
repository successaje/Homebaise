import { NextRequest, NextResponse } from 'next/server';
import { createHederaAccount } from '@/lib/hedera';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

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

    // Prefer using a service role on the server to bypass RLS for this update
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAdmin = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey)
      : null;

    const clientForUpdate = supabaseAdmin ?? createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    // Update user profile with the new Hedera details (do not overwrite any existing external wallet address)
    // If no external wallet is present, set wallet_address to the Hedera Account ID
    const { data: existingProfile } = await clientForUpdate
      .from('profiles')
      .select('wallet_address')
      .eq('id', user.id)
      .single();

    const updatePayload: Record<string, string> = {
      hedera_evm_address: accountResult.evmAddress,
      hedera_private_key: accountResult.privateKey, // In production: encrypt
      hedera_public_key: accountResult.publicKey
    };

    if (!existingProfile?.wallet_address || existingProfile.wallet_address.startsWith('0.')) {
      // If no wallet or already a Hedera account, set to Hedera account ID
      updatePayload.wallet_address = accountResult.accountId;
    }

    const { error: updateError } = await clientForUpdate
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      // Return success with a warning so the client still gets the account details
      return NextResponse.json({
        success: true,
        warning: 'Profile update failed, but Hedera account was created',
        account: {
          accountId: accountResult.accountId,
          evmAddress: accountResult.evmAddress,
          privateKey: accountResult.privateKey,
          balance: accountResult.balance
        }
      });
    }

    return NextResponse.json({
      success: true,
      account: {
        accountId: accountResult.accountId,
        evmAddress: accountResult.evmAddress,
        privateKey: accountResult.privateKey,
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