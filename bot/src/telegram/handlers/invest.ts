import { Context } from 'telegraf';
import { BotContext } from '../bot';
import { createInvestment } from '../../shared/api';
import { logNotification } from '../../shared/database';

export async function handleInvest(ctx: BotContext) {
  if (!ctx.session?.userId) {
    await ctx.reply('❌ You need to be authenticated. Use /start');
    return;
  }
  
  if (!ctx.message || !('text' in ctx.message)) {
    await ctx.reply('❌ Invalid message type');
    return;
  }
  
  const command = ctx.message.text?.split(' ');
  
  if (!command || command.length < 3) {
    await ctx.reply(
      `💸 *How to Invest*\n\n` +
      `Usage: /invest [property_id] [amount]\n\n` +
      `Example:\n` +
      `/invest abc123 100\n\n` +
      `This will invest $100 in the property with ID abc123\n\n` +
      `Use /browse to see available properties.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  const propertyId = command[1];
  const amount = parseFloat(command[2]);
  
  if (isNaN(amount) || amount < 10) {
    await ctx.reply(
      `❌ Invalid amount. Minimum investment is $10.`
    );
    return;
  }
  
  await ctx.reply(
    `⏳ Processing your investment of $${amount}...\n\n` +
    `This may take a few seconds.`
  );
  
  const result = await createInvestment(propertyId, amount, '');
  
  if (result.success) {
    await ctx.reply(
      `✅ *Investment Successful!*\n\n` +
      `Amount: $${amount}\n` +
      `Property ID: ${propertyId}\n` +
      `Transaction: ${result.transactionId}\n\n` +
      `Your tokens will arrive in ~5 seconds.\n\n` +
      `View on HashScan: [Transaction](${result.transactionId})\n\n` +
      `Use /portfolio to see your updated investments.`,
      { parse_mode: 'Markdown' }
    );
    
    await logNotification(
      ctx.session.userId,
      'telegram',
      String(ctx.chat?.id),
      'investment',
      'Investment Successful',
      `Invested $${amount} in property ${propertyId}`
    );
  } else {
    await ctx.reply(
      `❌ Investment failed: ${result.error}\n\n` +
      `Please try again or contact support if the issue persists.`
    );
  }
}

