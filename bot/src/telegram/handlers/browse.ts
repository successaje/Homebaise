import { Context } from 'telegraf';
import { BotContext } from '../bot';
import { getProperties } from '../../shared/api';
import { logNotification } from '../../shared/database';

export async function handleBrowse(ctx: BotContext) {
  if (!ctx.session?.userId) {
    await ctx.reply('❌ You need to be authenticated. Use /start');
    return;
  }
  
  await ctx.reply('⏳ Loading available properties...');
  
  const properties = await getProperties('');
  
  if (!properties || properties.length === 0) {
    await ctx.reply(
      `🏠 No properties available at the moment.\n\n` +
      `This might be because:\n` +
      `• No properties are currently listed\n` +
      `• The service is temporarily unavailable\n` +
      `• There's a connection issue\n\n` +
      `Please try again later or visit the main Homebaise app.`
    );
    return;
  }
  
  let message = `🏠 *Available Properties*\n\n`;
  
  properties.slice(0, 10).forEach((property, index) => {
    const name = property.name || property.title || 'Unknown Property';
    const location = property.location || property.city || property.country || 'Unknown Location';
    const value = Number(property.totalValue ?? property.price ?? property.targetAmount ?? 0);
    const funded = Number(property.fundedPercent ?? property.funded_percent ?? 0);
    const yieldRate = Number(property.yieldRate ?? property.expectedYield ?? 0);
    const available = Number(property.availableFunding ?? 0);
  
    message += `${index + 1}. *${name}*\n`;
    message += `   📍 ${location}\n`;
    message += `   💵 Value: $${value > 0 ? value.toLocaleString() : 'N/A'}\n`;
    message += `   📊 Funding: ${funded}%\n`;
    message += `   📈 Yield: ${yieldRate}%\n`;
    if (available > 0) {
      message += `   💰 Available: $${available.toLocaleString()}\n`;
    }
    message += `\n`;
  });
  
  message += `_Tip: Use the inline buttons or quick commands to invest without leaving Telegram._`;
  
  await ctx.reply(message, { parse_mode: 'Markdown' });
  
  await logNotification(
    ctx.session.userId,
    'telegram',
    String(ctx.chat?.id),
    'browse',
    'Properties Browsed',
    'User browsed available properties'
  );
}

