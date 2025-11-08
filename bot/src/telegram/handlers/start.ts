import { BotContext } from '../bot';
import { getUserByPhone } from '../../shared/database';
import { createOTP } from '../../shared/auth';
import { buildMainMenuKeyboard } from '../ui';

export async function handleStart(ctx: BotContext) {
  const chatId = String(ctx.chat?.id);
  const firstName = ctx.from?.first_name || 'there';
  
  // Check if already authenticated
  if (ctx.session?.authenticated) {
    await ctx.reply(
      `👋 Welcome back, ${firstName}!\n\n` +
      `Choose an action below to continue.`,
      {
        parse_mode: 'Markdown',
        reply_markup: buildMainMenuKeyboard(),
      }
    );
    return;
  }
  
  // Request phone number
  await ctx.reply(
    `👋 Welcome to Homebaise, ${firstName}!\n\n` +
    `To get started, I need to verify your account.\n\n` +
    `Please send me your phone number (with country code)\n` +
    `Example: +2348012345678\n\n` +
    `You can either:\n` +
    `• Use the button below to share your contact\n` +
    `• Or type your phone number directly`,
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

