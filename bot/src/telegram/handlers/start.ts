import { BotContext } from '../bot';
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
  
  const intro =
    `👋 *Welcome to Homebaise*, ${firstName}!
 
 • Discover tokenized properties
 • Track your earnings in real time
 • Manage investments directly in Telegram`;
 
  await ctx.reply(intro, {
    parse_mode: 'Markdown',
    reply_markup: buildMainMenuKeyboard(),
  });
 
  await ctx.reply(
    `To link your Homebaise account, share the phone number you registered with (including country code).`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [[{ text: '📱 Share Phone Number', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    }
  );
  
  // Phone number processing continues in the main bot handler
}

