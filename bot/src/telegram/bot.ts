import { Telegraf, Context } from 'telegraf';
import { config } from '../shared/config';
import * as dns from 'dns';

// Set DNS to prefer IPv4 for better connectivity
dns.setDefaultResultOrder('ipv4first');
import { getBotSession, createBotSession } from '../shared/database';
import { getUserByPhone, logNotification } from '../shared/database';
import { createOTP, verifyOTP, createSessionToken } from '../shared/auth';
import { getUserPortfolio, getWalletBalance, getProperties, createInvestment } from '../shared/api';
import { handleStart } from './handlers/start';
import { handlePortfolio } from './handlers/portfolio';
import { handleBalance } from './handlers/balance';
import { handleBrowse } from './handlers/browse';
import { handleInvest } from './handlers/invest';

// Extend context to include user session
export interface BotContext extends Context {
  session?: {
    userId?: string;
    phoneNumber?: string;
    authenticated?: boolean;
    awaitingOTP?: boolean;
  };
}

// Initialize bot with custom options
const bot = new Telegraf<BotContext>(config.telegram.token, {
  telegram: {
    apiRoot: 'https://api.telegram.org',
    webhookReply: false
  }
});

// Session middleware
bot.use(async (ctx: BotContext, next) => {
  const chatId = String(ctx.chat?.id);
  
  // Try to get existing session
  const session = await getBotSession('telegram', chatId);
  
  if (session) {
    ctx.session = {
      userId: session.user_id,
      authenticated: true,
    };
  } else {
    ctx.session = {
      authenticated: false,
    };
  }
  
  await next();
});

// Authentication middleware
const requireAuth = async (ctx: BotContext, next: () => Promise<void>) => {
  if (!ctx.session?.authenticated) {
    await ctx.reply(
      '🔐 Please authenticate first using /start',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  await next();
};

// Command handlers
bot.start(handleStart);
bot.command('portfolio', requireAuth, handlePortfolio);
bot.command('balance', requireAuth, handleBalance);
bot.command('browse', requireAuth, handleBrowse);
bot.command('invest', requireAuth, handleInvest);
bot.command('help', async (ctx) => {
  await ctx.reply(
    `*Homebaise Bot Commands*\n\n` +
    `📊 */portfolio* - View your investment portfolio\n` +
    `💰 */balance* - Check your HBAR balance\n` +
    `🏠 */browse* - Browse available properties\n` +
    `💸 */invest* - Invest in a property\n` +
    `❓ */help* - Show this help message\n\n` +
    `_Start any command with / to see what you can do!_`,
    { parse_mode: 'Markdown' }
  );
});

// Handle contact/phone number
bot.on('contact', async (ctx: BotContext) => {
  if (!ctx.message || !('contact' in ctx.message)) return;
  
  const chatId = String(ctx.chat?.id);
  const phoneNumber = ctx.message.contact.phone_number;
  
  console.log(`📱 Received contact from Telegram: ${phoneNumber}`);
  
  // Find user by phone number
  const user = await getUserByPhone(phoneNumber);
  
  if (!user) {
    await ctx.reply(
      `❌ Phone number not found in our system.\n\n` +
      `Please ensure you've registered with this phone number on Homebaise.\n\n` +
      `You can update your phone number in your profile settings.\n\n` +
      `_Debug: Looking for phone "${phoneNumber}"_`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  // Store phone number in session for OTP verification
  try {
    await createBotSession(
      user.id,
      'telegram',
      chatId
    );
  } catch (error) {
    console.log('⚠️ Bot session already exists, continuing...');
  }
  
  // Generate and send OTP
  const otp = await createOTP(phoneNumber, 'telegram', chatId);
  
  // In production, send OTP via SMS or email
  // For now, we'll send it in the chat (NOT recommended for production)
  await ctx.reply(
    `✅ Account found!\n\n` +
    `Welcome ${user.full_name || user.email || 'User'}!\n\n` +
    `Your OTP is: *${otp}*\n\n` +
    `⚠️ This is for testing only. In production, OTP will be sent via SMS.\n\n` +
    `Please enter this code to verify:`,
    { parse_mode: 'Markdown' }
  );
  
  ctx.session = { awaitingOTP: true };
});

// Handle phone number as text (fallback for manual entry)
bot.on('text', async (ctx: BotContext) => {
  if (!ctx.message || !('text' in ctx.message)) return;
  
  const text = ctx.message.text;
  const chatId = String(ctx.chat?.id);
  
  // Check if it's a phone number (starts with + and contains digits)
  if (text.match(/^\+\d{10,15}$/) && !ctx.session?.awaitingOTP) {
    console.log(`📱 Received phone number as text: ${text}`);
    
    // Find user by phone number
    const user = await getUserByPhone(text);
    
    if (!user) {
      await ctx.reply(
        `❌ Phone number not found in our system.\n\n` +
        `Please ensure you've registered with this phone number on Homebaise.\n\n` +
        `You can update your phone number in your profile settings.\n\n` +
        `_Debug: Looking for phone "${text}"_`,
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    // Store phone number in session for OTP verification
    try {
      await createBotSession(
        user.id,
        'telegram',
        chatId
      );
    } catch (error) {
      console.log('⚠️ Bot session already exists, continuing...');
    }
    
    // Generate and send OTP
    const otp = await createOTP(text, 'telegram', chatId);
    
    await ctx.reply(
      `✅ Account found!\n\n` +
      `Welcome ${user.full_name || user.email || 'User'}!\n\n` +
      `Your OTP is: *${otp}*\n\n` +
      `⚠️ This is for testing only. In production, OTP will be sent via SMS.\n\n` +
      `Please enter this code to verify:`,
      { parse_mode: 'Markdown' }
    );
    
    ctx.session = { awaitingOTP: true };
    return;
  }
  
  // Handle OTP verification
  if (ctx.session?.awaitingOTP) {
    const text = ctx.message.text;
    const chatId = String(ctx.chat?.id);
    
    console.log(`🔐 OTP verification attempt: "${text}" for chat ${chatId}`);
    
    // Verify OTP
    const result = await verifyOTP('telegram', chatId, text);
    
    console.log(`🔐 OTP verification result:`, result);
    
    if (result.success && result.userId) {
      // Create bot session
      const session = await createBotSession(
        result.userId,
        'telegram',
        chatId
      );
      
      if (session) {
        ctx.session = {
          userId: result.userId,
          phoneNumber: result.phoneNumber,
          authenticated: true,
        };
        
        await ctx.reply(
          `✅ *Authentication successful!*\n\n` +
          `Welcome to Homebaise! 🎉\n\n` +
          `You can now:\n` +
          `• View your portfolio with /portfolio\n` +
          `• Check balance with /balance\n` +
          `• Browse properties with /browse\n` +
          `• Invest with /invest\n\n` +
          `_Type /help for more commands_`,
          { parse_mode: 'Markdown' }
        );
        
        await logNotification(
          result.userId,
          'telegram',
          chatId,
          'auth',
          'Welcome to Homebaise',
          'User successfully authenticated'
        );
      }
    } else {
      await ctx.reply(
        `❌ Invalid or expired OTP. Please try again with /start`
      );
    }
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ An error occurred. Please try again later.');
});

// Add debug logging for all messages (before launch)
bot.use((ctx, next) => {
  console.log('📨 Received message:', {
    type: ctx.updateType,
    chatId: ctx.chat?.id,
    userId: ctx.from?.id,
    text: ctx.message && 'text' in ctx.message ? ctx.message.text || 'No text' : 'No text',
    contact: ctx.message && 'contact' in ctx.message ? 'Contact shared' : 'No contact'
  });
  return next();
});

// Start bot (only if this file is run directly or if token is configured)
export function startTelegramBot() {
  if (config.telegram.token) {
    console.log('🤖 Starting Telegram bot with token:', config.telegram.token.substring(0, 10) + '...');
    
    bot.launch().then(() => {
      console.log('✅ Telegram bot started successfully');
      console.log('📱 Bot is ready to receive messages!');
    }).catch((error) => {
      console.error('❌ Failed to start Telegram bot:', error);
    });
    
    // Graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  } else {
    console.warn('⚠️  Telegram bot token not configured');
  }
}

// Auto-start if this file is run directly (when using npm run telegram)
// When imported via server.ts, startTelegramBot() is called explicitly
try {
  // @ts-ignore - require.main check for CommonJS compatibility
  if (typeof require !== 'undefined' && require.main === module) {
    startTelegramBot();
  }
} catch {
  // Ignore if require is not available (ESM mode)
}

export { bot };

