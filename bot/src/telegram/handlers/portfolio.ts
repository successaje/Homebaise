import { Context } from 'telegraf';
import { BotContext } from '../bot';
import { getUserPortfolio } from '../../shared/api';
import { logNotification } from '../../shared/database';

export async function handlePortfolio(ctx: BotContext) {
  if (!ctx.session?.userId) {
    await ctx.reply('❌ You need to be authenticated. Use /start');
    return;
  }
  
  await ctx.reply('⏳ Loading your portfolio...');
  
  // Get portfolio data from API
  // Note: You'll need to get the user's auth token
  // For now, we'll use a placeholder
  const portfolio = await getUserPortfolio(ctx.session.userId, '');
  
  if (!portfolio) {
    await ctx.reply(
      `❌ Unable to load portfolio data.\n\n` +
      `This might be because:\n` +
      `• Your account is not fully set up in the main app\n` +
      `• You haven't made any investments yet\n` +
      `• The service is temporarily unavailable\n\n` +
      `Please visit the main Homebaise app to complete your setup or make your first investment.`
    );
    return;
  }
  
  // Format portfolio message
  const returnsEmoji = portfolio.returns >= 0 ? '📈' : '📉';
  const returnsColor = portfolio.returns >= 0 ? '+' : '';
  
  let message = `📊 *Your Homebaise Portfolio*\n\n`;
  message += `💵 *Total Invested*: $${portfolio.totalInvested.toLocaleString()}\n`;
  message += `🎯 *Current Value*: $${portfolio.currentValue.toLocaleString()}\n`;
  message += `${returnsEmoji} *Returns*: ${returnsColor}${portfolio.returns.toFixed(2)}%\n\n`;
  
  if (portfolio.properties.length > 0) {
    message += `*Properties:*\n\n`;
    portfolio.properties.forEach((property, index) => {
      message += `${index + 1}. *${property.name}*\n`;
      message += `   💵 Investment: $${property.investment.toLocaleString()}\n`;
      message += `   🪙 Tokens: ${property.tokens.toLocaleString()}\n`;
      message += `   📊 Funding: ${property.fundedPercent}%\n\n`;
    });
  } else {
    message += `_No investments yet. Use /browse to find properties!_`;
  }
  
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

