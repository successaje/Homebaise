import { Context } from 'telegraf';
import { BotContext } from '../bot';
import { getWalletBalance } from '../../shared/api';
import { logNotification } from '../../shared/database';

export async function handleBalance(ctx: BotContext) {
  if (!ctx.session?.userId) {
    await ctx.reply('❌ You need to be authenticated. Use /start');
    return;
  }
  
  await ctx.reply('⏳ Checking your balance...');
  
  const balance = await getWalletBalance(ctx.session.userId, '');
  
  if (!balance) {
    await ctx.reply(
      `❌ Unable to load balance.\n\n` +
      `Please check your connection or try again later.`
    );
    return;
  }
  
  let message = `💰 *Your Hedera Wallet*\n\n`;
  message += `💎 *HBAR Balance*: ${balance.hbarBalance.toFixed(2)} HBAR\n`;
  message += `💵 *USD Value*: ~$${balance.usdValue.toFixed(2)}\n\n`;
  
  if (balance.recentActivity.length > 0) {
    message += `*Recent Activity:*\n\n`;
    balance.recentActivity.slice(0, 5).forEach((activity) => {
      const emoji = activity.type === 'deposit' || activity.type === 'reward' ? '✅' : '❌';
      const sign = activity.type === 'deposit' || activity.type === 'reward' ? '+' : '-';
      message += `${emoji} ${sign}${activity.amount.toFixed(2)} HBAR - ${activity.type}\n`;
    });
  } else {
    message += `_No recent activity._`;
  }
  
  await ctx.reply(message, { parse_mode: 'Markdown' });
  
  await logNotification(
    ctx.session.userId,
    'telegram',
    String(ctx.chat?.id),
    'balance_check',
    'Balance Checked',
    'User checked wallet balance'
  );
}

