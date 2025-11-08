import { BotContext } from '../bot';
import { getUserProfile, getWalletSnapshot } from '../../shared/database';

export async function handleAccount(ctx: BotContext) {
  if (!ctx.session?.userId) {
    await ctx.reply('❌ You need to be authenticated. Use /start');
    return;
  }

  await ctx.reply('🔎 Gathering your account details...');

  const [profile, wallet] = await Promise.all([
    getUserProfile(ctx.session.userId),
    getWalletSnapshot(ctx.session.userId),
  ]);

  if (!profile) {
    await ctx.reply('❌ Unable to load your profile at the moment. Please try again later.');
    return;
  }

  const balance = wallet?.hbarBalance ?? 0;
  const usdValue = wallet?.usdValue ?? 0;

  let message = `👤 *Your Homebaise Profile*\n\n`;
  message += `• *Name*: ${profile.full_name || 'Not set'}\n`;
  message += `• *Email*: ${profile.email || 'Not set'}\n`;
  message += `• *Phone*: ${profile.phone_number || 'Not set'}\n\n`;

  message += `💎 *Hedera Wallet*\n`;
  message += `• *Account ID*: ${wallet?.accountId ? `\`${wallet.accountId}\`` : '_Not linked_'}\n`;
  message += `• *Balance*: ${balance.toFixed(4)} HBAR (~$${usdValue.toFixed(2)})\n`;

  await ctx.reply(message, { parse_mode: 'Markdown' });
}

