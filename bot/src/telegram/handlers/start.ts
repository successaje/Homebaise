import { Context } from 'telegraf';
import { BotContext } from '../bot';
import { getUserByPhone } from '../../shared/database';
import { createOTP } from '../../shared/auth';

export async function handleStart(ctx: BotContext) {
  const chatId = String(ctx.chat?.id);
  const firstName = ctx.from?.first_name || 'there';
  
  // Check if already authenticated
  if (ctx.session?.authenticated) {
    await ctx.reply(
      `👋 Welcome back, ${firstName}!\n\n` +
      `You're already authenticated. Here's what you can do:\n\n` +
      `📊 /portfolio - View your investments\n` +
      `💰 /balance - Check your balance\n` +
      `🏠 /browse - Browse properties\n` +
      `💸 /invest - Make an investment\n` +
      `❓ /help - See all commands`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  // Request phone number
  await ctx.reply(
    `👋 Welcome to Homebaise, ${firstName}!\n\n` +
    `To get started, I need to verify your account.\n\n` +
    `Please send me your phone number (with country code)\n` +
    `Example: +2348012345678`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          [{ text: '📱 Share Phone Number', request_contact: true }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    }
  );
  
  // Handle phone number response in bot.ts via contact handler
}

