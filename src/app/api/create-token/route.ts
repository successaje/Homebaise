import { NextRequest, NextResponse } from 'next/server';
import { createFungibleToken } from '@/lib/hedera';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { tokenName, tokenSymbol, initialSupply, decimals } = body ?? {};
    if (!tokenName || !tokenSymbol || typeof initialSupply !== 'number') {
      return NextResponse.json({ error: 'tokenName, tokenSymbol, initialSupply required' }, { status: 400 });
    }
    const result = await createFungibleToken({ tokenName, tokenSymbol, initialSupply, decimals });
    return NextResponse.json({ success: true, tokenId: result.tokenId });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create token';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

