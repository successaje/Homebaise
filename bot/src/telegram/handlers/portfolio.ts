import { Context } from 'telegraf';
import { BotContext } from '../bot';
import { getUserPortfolio } from '../../shared/api';
import { logNotification } from '../../shared/database';
import { ACTIONS } from '../ui';

export async function handlePortfolio(ctx: BotContext) {
  if (!ctx.session?.userId) {
    await ctx.reply('❌ You need to be authenticated. Use /start');
    return;
  }
  
  await ctx.reply('⏳ Loading your portfolio...');
  
  const portfolio = await getUserPortfolio(ctx.session.userId);
  
  if (!portfolio) {
    await ctx.reply(
      `❌ Unable to load portfolio data.\n\n` +
      `Please visit the Homebaise app to confirm your account setup or try again shortly.`
    );
    return;
  }
  
  if (!portfolio.properties.length) {
    await ctx.reply(
      `You don't have any investments yet.\n\nBrowse available properties to make your first investment.`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: 'Browse Properties', callback_data: ACTIONS.VIEW_PROPERTIES }]],
        },
      }
    );
    return;
  }
  
  const earnings = portfolio.returns || 0;
  const earningsEmoji = earnings >= 0 ? '📈' : '📉';
  const earningsLabel = earnings >= 0 ? `+$${earnings.toFixed(2)}` : `-$${Math.abs(earnings).toFixed(2)}`;
  
  let message = `📊 *Your Homebaise Portfolio*\n\n`;
  message += `💵 *Total Invested*: $${portfolio.totalInvested.toLocaleString()}\n`;
  message += `${earningsEmoji} *Lifetime Earnings*: ${earningsLabel}\n\n`;
  
  portfolio.properties.slice(0, 5).forEach((property, index) => {
    message += `${index + 1}. *${property.name}*\n`;
    message += `   💵 Investment: $${property.investment.toLocaleString()}\n`;
    message += `   🪙 Tokens: ${property.tokens.toLocaleString()}\n`;
    if (property.fundedPercent) {
      message += `   📊 Funding: ${property.fundedPercent}%\n`;
    }
    message += '\n';
  });
  
  await ctx.reply(message, { parse_mode: 'Markdown' });
  
  await logNotification(
    ctx.session.userId,
    'telegram',
    String(ctx.chat?.id),
    'portfolio_view',
    'Portfolio Viewed',
    'User viewed their portfolio'
  );
}

