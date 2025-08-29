import { NextRequest, NextResponse } from 'next/server';
import { createNftAndMint } from '@/lib/hedera';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { tokenName, tokenSymbol, maxSupply, metadataCids } = body ?? {};
    if (!tokenName || !tokenSymbol || typeof maxSupply !== 'number' || !Array.isArray(metadataCids) || metadataCids.length === 0) {
      return NextResponse.json({ error: 'tokenName, tokenSymbol, maxSupply, metadataCids[] required' }, { status: 400 });
    }
    const result = await createNftAndMint({ tokenName, tokenSymbol, maxSupply, metadataCids });
    return NextResponse.json({ success: true, tokenId: result.tokenId, serials: result.mintedSerials });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create NFT';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

