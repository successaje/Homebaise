import { NextRequest, NextResponse } from 'next/server'
import { Client, PrivateKey, TokenId, TokenInfoQuery } from '@hashgraph/sdk'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tokenIdParam = searchParams.get('tokenId')
    if (!tokenIdParam) {
      return NextResponse.json({ error: 'tokenId is required' }, { status: 400 })
    }

    const operatorId = process.env.HEDERA_OPERATOR_ID || process.env.MY_ACCOUNT_ID
    const operatorPrivateKey = process.env.HEDERA_OPERATOR_PRIVATE_KEY || process.env.MY_PRIVATE_KEY

    if (!operatorId || !operatorPrivateKey) {
      return NextResponse.json({ error: 'Hedera operator credentials not configured' }, { status: 500 })
    }

    const client = Client.forTestnet()
    client.setOperator(operatorId, PrivateKey.fromString(operatorPrivateKey))

    const tokenId = TokenId.fromString(tokenIdParam)
    const info = await new TokenInfoQuery().setTokenId(tokenId).execute(client)

    // Map fields for the frontend
    const result = {
      tokenId: tokenId.toString(),
      name: info.name,
      symbol: info.symbol,
      totalSupply: info.totalSupply?.toString?.() ?? String(info.totalSupply),
      decimals: Number(info.decimals),
      treasuryAccountId: info.treasuryAccountId?.toString?.() ?? null,
      adminKey: info.adminKey ? String(info.adminKey) : null,
      freezeDefault: Boolean(info.defaultFreezeStatus),
      supplyType: info.supplyType?.toString?.() ?? null,
      expiry: info.expirationTime ? new Date(Number(info.expirationTime) * 1000).toISOString() : null,
      autoRenewAccountId: info.autoRenewAccountId?.toString?.() ?? null,
      autoRenewPeriodSeconds: info.autoRenewPeriod?.seconds ?? null,
      kycKey: info.kycKey ? String(info.kycKey) : null,
      wipeKey: info.wipeKey ? String(info.wipeKey) : null,
      pauseKey: info.pauseKey ? String(info.pauseKey) : null,
      customFees: info.customFees ? info.customFees.map((f: any) => String(f)) : [],
    }

    return NextResponse.json({ success: true, token: result })
  } catch (error) {
    console.error('Error fetching token info:', error)
    return NextResponse.json({ error: 'Failed to fetch token info' }, { status: 500 })
  }
}
