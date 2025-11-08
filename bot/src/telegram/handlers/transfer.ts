import { BotContext } from '../bot';
import { transferHbarThroughBot } from '../../shared/api';
import { normalizePhoneNumber } from '../../shared/database';

const ACCOUNT_ID_REGEX = /^\d+\.\d+\.\d+$/;

export async function handleTransfer(ctx: BotContext) {
  if (!ctx.session?.userId) {
    await ctx.reply('❌ You need to be authenticated. Use /start');
    return;
  }

  if (!ctx.message || !('text' in ctx.message) || !ctx.message.text) {
    await ctx.reply('❌ I need a command like `/transfer 5 +2348012345678`', { parse_mode: 'Markdown' });
    return;
  }

  const rawText = ctx.message.text.trim();
  const parts = rawText.split(/\s+/);

  if (parts.length < 3) {
    await ctx.reply(
      `❌ Usage: \`/transfer <amount_hbar> <phone|accountId> [| memo]\`\n` +
      `Example: \`/transfer 5 +2348012345678 | Rent for Lagos property\``,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const amountValue = Number(parts[1].replace(/[^\d.]/g, ''));

  if (!Number.isFinite(amountValue) || amountValue <= 0) {
    await ctx.reply('❌ Please provide a valid positive amount in HBAR.');
    return;
  }

  const destinationRaw = rawText.substring(rawText.indexOf(parts[2]));
  const [recipientSegment, memoSegment] = destinationRaw.split('|').map((segment) => segment.trim());

  let recipientPhone: string | undefined;
  let recipientAccountId: string | undefined;

  const normalizedRecipient = recipientSegment.replace(/\s+/g, '');

  if (/^\+?\d{7,15}$/.test(normalizedRecipient)) {
    recipientPhone = normalizePhoneNumber(normalizedRecipient);
  } else if (ACCOUNT_ID_REGEX.test(normalizedRecipient)) {
    recipientAccountId = normalizedRecipient;
  } else {
    await ctx.reply(
      '❌ Recipient must be a phone number with country code (e.g., +2348012345678) or a Hedera account ID (e.g., 0.0.123456).'
    );
    return;
  }

  await ctx.reply('⏳ Processing your transfer...');

  const result = await transferHbarThroughBot({
    senderId: ctx.session.userId,
    amount: Number(amountValue.toFixed(8)),
    recipientPhone,
    recipientAccountId,
    memo: memoSegment && memoSegment.length > 0 ? memoSegment : undefined,
  });

  if (!result.success) {
    await ctx.reply(
      `❌ Transfer failed: ${result.error || 'Unknown error'}\n\n` +
      `Please verify the recipient details and your available balance.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  let message = `✅ *Transfer Complete!*\n\n`;
  message += `• *Amount*: ${amountValue.toFixed(4)} HBAR\n`;
  message += `• *Recipient*: ${result.recipientName || recipientPhone || recipientAccountId}\n`;
  message += `• *Account ID*: \`${result.receiverAccountId}\`\n`;

  if (result.hashscanUrl) {
    message += `\n🔗 [View on Hashscan](${result.hashscanUrl})`;
  }

  await ctx.reply(message, { parse_mode: 'Markdown' });
}

