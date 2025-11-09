import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHederaAccount, hasHederaOperatorCredentials, sendHbar } from '@/lib/hedera';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

type TransferBody = {
  senderId?: string;
  amount?: number;
  recipientPhone?: string;
  recipientAccountId?: string;
  memo?: string;
};

function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[^\d+]/g, '');
  if (normalized.startsWith('0')) {
    normalized = `+234${normalized.substring(1)}`;
  }
  if (normalized.startsWith('234') && !normalized.startsWith('+234')) {
    normalized = `+${normalized}`;
  }
  return normalized;
}

function isHederaAccountId(value?: string | null): value is string {
  return typeof value === 'string' && /^\d+\.\d+\.\d+$/.test(value.trim());
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-bot-token') || request.headers.get('X-Bot-Token');
    if (!token || token !== process.env.BOT_SERVER_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const body = (await request.json().catch(() => ({}))) as TransferBody;
    const rawAmount = Number(body.amount);

    if (!body.senderId || !Number.isFinite(rawAmount) || rawAmount <= 0) {
      return NextResponse.json({ error: 'Invalid sender or amount' }, { status: 400 });
    }

    if (!body.recipientPhone && !body.recipientAccountId) {
      return NextResponse.json({ error: 'Recipient required (phone or accountId)' }, { status: 400 });
    }

    const amount = Number(rawAmount.toFixed(8));

    const { data: sender, error: senderError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, phone_number, hedera_account_id, hedera_private_key')
      .eq('id', body.senderId)
      .maybeSingle();

    if (senderError || !sender) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    }

    if (!sender.hedera_account_id || !sender.hedera_private_key) {
      return NextResponse.json({ error: 'Sender does not have a Hedera account linked' }, { status: 400 });
    }

    let receiverAccountId: string | null = null;
    let recipientName: string | null = null;

    if (body.recipientAccountId) {
      if (!isHederaAccountId(body.recipientAccountId)) {
        return NextResponse.json({ error: 'Recipient account ID is invalid' }, { status: 400 });
      }
      receiverAccountId = body.recipientAccountId.trim();
    } else if (body.recipientPhone) {
      const normalizedPhone = normalizePhone(body.recipientPhone);
      const { data: recipient, error: recipientError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, phone_number, hedera_account_id, hedera_private_key, hedera_public_key')
        .eq('phone_number', normalizedPhone)
        .maybeSingle();

      if (recipientError || !recipient) {
        return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
      }

      recipientName = recipient.full_name ?? recipient.email ?? normalizedPhone;

      if (isHederaAccountId(recipient.hedera_account_id)) {
        receiverAccountId = recipient.hedera_account_id.trim();
      } else if (isHederaAccountId(recipient.hedera_private_key ?? undefined)) {
        // Should never happen, but guard just in case
        receiverAccountId = recipient.hedera_private_key!;
      } else {
        if (!hasHederaOperatorCredentials()) {
          return NextResponse.json({ error: 'Recipient has no Hedera account and operator credentials are missing' }, { status: 400 });
        }

        const newAccount = await createHederaAccount();
        receiverAccountId = newAccount.accountId;

        await supabaseAdmin
          .from('profiles')
          .update({
            hedera_account_id: newAccount.accountId,
            hedera_private_key: newAccount.privateKey,
            hedera_public_key: newAccount.publicKey,
            wallet_address: newAccount.accountId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recipient.id);
      }
    }

    if (!receiverAccountId) {
      return NextResponse.json({ error: 'Unable to resolve recipient account' }, { status: 400 });
    }

    if (receiverAccountId === sender.hedera_account_id) {
      return NextResponse.json({ error: 'Cannot transfer to your own account' }, { status: 400 });
    }

    const memo =
      body.memo?.slice(0, 90) ||
      `Telegram transfer from ${sender.full_name || sender.email || 'Homebaise user'}`;

    const transferResult = await sendHbar({
      senderAccountId: sender.hedera_account_id,
      senderPrivateKey: sender.hedera_private_key,
      receiverAccountId,
      amount,
      memo,
    });

    return NextResponse.json({
      success: true,
      transactionId: transferResult.transactionId,
      status: transferResult.status,
      hashscanUrl: transferResult.hashscanUrl,
      receiverAccountId,
      recipientName,
    });
  } catch (error) {
    console.error('bot/transfer error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

