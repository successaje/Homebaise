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
    message += `${index + 1}. *${property.name}*\n`;
    message += `   📍 ${property.location}\n`;
    message += `   💵 Value: $${property.totalValue.toLocaleString()}\n`;
    message += `   📊 Funding: ${property.fundedPercent}%\n`;
    message += `   📈 Yield: ${property.yieldRate}%\n`;
    message += `   💰 Available: $${property.availableFunding.toLocaleString()}\n\n`;
  });
  
  message += `_Use /invest [property_id] [amount] to invest_\n`;
  message += `_Example: /invest 123 100_`;
  
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

