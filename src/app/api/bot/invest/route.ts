import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAnon } from '@/lib/supabase';
import { executePropertyInvestment } from '@/lib/investment-flow';
import { Property } from '@/types/property';

// Use service-role for server-side bot operations to bypass RLS
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  : supabaseAnon;

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-bot-token') || request.headers.get('X-Bot-Token');
    if (!token || token !== process.env.BOT_SERVER_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const dryRunParam = url.searchParams.get('dryRun');
    const isDryRun = dryRunParam === 'true';

    const body = await request.json().catch(() => ({}));
    const { title, amountUsd, userId } = body || {};

    if (!title || (!isDryRun && (!amountUsd || Number(amountUsd) <= 0))) {
      return NextResponse.json({ error: 'Invalid payload', details: { title: !!title, amountUsd } }, { status: 400 });
    }

    let property: Property | null = null;
    if (process.env.BOT_SKIP_DB === 'true') {
      // Skip DB lookup in demo/offline mode
      property = { 
        id: `demo-${Date.now()}`, 
        title,
        status: 'active',
        listed_by: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Property;
    } else {
      try {
        // Prepare candidate titles to handle NL commands like
        // "Invest $15 dollars in Accra EcoVillas Estate"
        const rawTitle = String(title || '').trim();
        const afterIn = rawTitle.toLowerCase().includes(' in ')
          ? rawTitle.substring(rawTitle.toLowerCase().lastIndexOf(' in ') + 4).trim()
          : rawTitle;
        const cleanedAfterIn = afterIn
          .replace(/^["'\s]+|["'\s]+$/g, '') // trim quotes/spaces
          .replace(/[.$]/g, '') // strip trailing punctuation
          .trim();

        const candidates = Array.from(new Set([
          rawTitle,
          cleanedAfterIn,
        ].filter(Boolean)));

        // Try exact ilike match then fuzzy %...% for each candidate
        for (const c of candidates) {
          if (property) break;
        const { data: exactMatch } = await supabaseAdmin
            .from('properties')
            .select('*')
            .ilike('title', c)
            .limit(1);
          property = exactMatch && exactMatch[0];
        }

        if (!property) {
          for (const c of candidates) {
            if (property) break;
            const { data: partialMatch } = await supabaseAdmin
              .from('properties')
              .select('*')
              .ilike('title', `%${c}%`)
              .limit(1);
            property = partialMatch && partialMatch[0];
          }
        }
      } catch (e) {
        // DNS/network issues? fall back to demo
        property = { 
          id: `demo-${Date.now()}`, 
          title,
          status: 'active',
          listed_by: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Property;
      }

      if (!property) {
        return NextResponse.json({ error: 'Property not found', details: { title } }, { status: 404 });
      }
    }

    // If demo mode, return mock tx; otherwise execute real flow
    if (process.env.BOT_SKIP_DB === 'true') {
      if (!property) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      }
      const transaction_hash = `0.0.12345@${Date.now()}`;
      return NextResponse.json({
        success: true,
        transaction_hash,
        property_id: property.id,
        amount_usd: Number(amountUsd),
        user_id: userId || null,
        mode: 'demo'
      });
    }

    if (!isDryRun && !userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Validate treasury for the resolved property_id (latest active row)
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    try {
      const { data: treasury, error: treasuryError } = await supabaseAdmin
        .from('property_treasury_accounts')
        .select('hedera_account_id, hedera_private_key, token_id, token_balance, status')
        .eq('property_id', property.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (treasuryError || !treasury) {
        return NextResponse.json({ error: 'Treasury account not found for property', details: { property_id: property.id, title } }, { status: 400 });
      }

      if (treasury.status !== 'active') {
        return NextResponse.json({ error: 'Treasury account is not active for property', details: { property_id: property.id, title, status: treasury.status } }, { status: 400 });
      }

      // If only resolving, return the lookup results without executing the investment
      if (isDryRun) {
        return NextResponse.json({
          success: true,
          mode: 'dryRun',
          property: { id: property.id, title: property.title },
          treasury: {
            hedera_account_id: treasury.hedera_account_id,
            token_id: treasury.token_id,
            token_balance: treasury.token_balance,
            status: treasury.status
          }
        }, { status: 200 });
      }
    } catch (e) {
      return NextResponse.json({ error: 'Failed to verify treasury account', details: { property_id: property.id, title } }, { status: 400 });
    }

    // Execute real investment using resolved property_id
    const result = await executePropertyInvestment(String(property.id), String(userId), Number(amountUsd));
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Investment failed' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      transaction_hash: result.transactionHash,
      property_id: property.id,
      amount_usd: Number(amountUsd),
      user_id: userId,
      mode: 'live'
    });
  } catch (error) {
    console.error('bot/invest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


