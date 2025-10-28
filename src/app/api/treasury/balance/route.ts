import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Uses service role on the server to read treasury rows and call mirror
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getTokenBalanceFromMirror(hederaAccountId: string, tokenId: string): Promise<number> {
  const baseUrl = process.env.NEXT_PUBLIC_HEDERA_MIRROR_NODE_URL || 'https://testnet.mirrornode.hedera.com';
  const url = `${baseUrl}/api/v1/accounts/${encodeURIComponent(hederaAccountId)}/tokens?token.id=${encodeURIComponent(tokenId)}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Mirror node error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  const tokens = json?.tokens as Array<{ token_id: string; balance: string | number; decimals?: number }> | undefined;
  if (!tokens || tokens.length === 0) return 0;
  const entry = tokens.find(t => t.token_id === tokenId) || tokens[0];
  if (!entry) return 0;
  const rawBalance = typeof entry.balance === 'string' ? parseFloat(entry.balance) : entry.balance;
  const decimals = entry.decimals ?? 0;
  const divisor = Math.pow(10, decimals);
  return divisor > 0 ? Math.floor(rawBalance / divisor) : Math.floor(rawBalance);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('property_treasury_accounts')
      .select('hedera_account_id, token_id, token_balance, status')
      .eq('property_id', propertyId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ balance: 0, source: 'none' }, { status: 200 });
    }

    const hederaAccountId = (data as Record<string, unknown>).hedera_account_id as string | null;
    const tokenId = (data as Record<string, unknown>).token_id as string | null;

    if (hederaAccountId && tokenId) {
      try {
        const balance = await getTokenBalanceFromMirror(hederaAccountId, tokenId);
        return NextResponse.json({ balance, source: 'mirror' }, { status: 200 });
      } catch (mirrorError: unknown) {
        // Fall back to DB stored value
        const balance = (data as Record<string, unknown>)?.token_balance as number || 0;
        return NextResponse.json({ balance, source: 'db', mirrorError: mirrorError instanceof Error ? mirrorError.message : 'Unknown error' }, { status: 200 });
      }
    }

    // Fallback when missing identifiers
    const balance = (data as Record<string, unknown>)?.token_balance as number || 0;
    return NextResponse.json({ balance, source: 'db' }, { status: 200 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Internal error' }, { status: 500 });
  }
}


