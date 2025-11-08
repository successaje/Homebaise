import { Telegraf, Context } from 'telegraf';
import { config } from '../shared/config';
import * as dns from 'dns';

// Set DNS to prefer IPv4 for better connectivity
dns.setDefaultResultOrder('ipv4first');
import {
  getBotSession,
  createBotSession,
  getUserByPhone,
  logNotification,
  createUserWithPhoneAndEmail,
  ensureHederaAccountForUser,
  normalizePhoneNumber,
} from '../shared/database';
import { createOTP, verifyOTP } from '../shared/auth';
import { getUserPortfolio, getWalletBalance, getProperties, createInvestment } from '../shared/api';
import { handleStart } from './handlers/start';
import { handlePortfolio } from './handlers/portfolio';
import { handleBalance } from './handlers/balance';
import { handleBrowse } from './handlers/browse';
import { handleInvest } from './handlers/invest';
import { handleTransfer } from './handlers/transfer';
import { handleAccount } from './handlers/account';

// Extend context to include user session
export interface BotContext extends Context {
  session?: {
    userId?: string;
    phoneNumber?: string;
    authenticated?: boolean;
    awaitingOTP?: boolean;
    awaitingEmail?: boolean;
    pendingPhone?: string;
  };
}

type SessionState = NonNullable<BotContext['session']>;
const sessionStore = new Map<string, SessionState>();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSessionState(chatId: string): SessionState {
  return sessionStore.get(chatId) ?? {};
}

function persistSessionState(chatId: string, state: SessionState) {
  sessionStore.set(chatId, state);
}

function isValidEmail(value: string): boolean {
  return emailRegex.test(value.trim().toLowerCase());
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
  const chatId = ctx.chat?.id ? String(ctx.chat.id) : undefined;

  if (!chatId) {
    await next();
    return;
  }

  const state = getSessionState(chatId);
  
  try {
    const session = await getBotSession('telegram', chatId);
    
    if (session) {
      state.userId = session.user_id;
      state.authenticated = true;
      state.awaitingOTP = false;
      state.awaitingEmail = false;
      state.pendingPhone = undefined;
    } else if (!state.awaitingOTP && !state.awaitingEmail) {
      state.authenticated = false;
      state.userId = undefined;
    }
  } catch (error) {
    console.error('Failed to hydrate session:', error);
  }

  ctx.session = state;
  await next();

  if (ctx.session) {
    persistSessionState(chatId, ctx.session);
  }
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
bot.command('transfer', requireAuth, handleTransfer);
bot.command('account', requireAuth, handleAccount);
bot.command('help', async (ctx) => {
  await ctx.reply(
    `*Homebaise Bot Commands*\n\n` +
    `📊 */portfolio* - View your investment portfolio\n` +
    `💰 */balance* - Check your HBAR balance\n` +
    `🏠 */browse* - Browse available properties\n` +
    `💸 */invest* - Invest in a property\n` +
    `🔁 */transfer* - Send HBAR to another user\n` +
    `🪪 */account* - View your account & wallet details\n` +
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

  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  
  // Find user by phone number
  const user = await getUserByPhone(phoneNumber);

  if (!user) {
    await ctx.reply(
      `👋 I couldn't find an existing Homebaise account for *${normalizedPhone}*.\n\n` +
      `Let's create one real quick!\n\n` +
      `Please reply with your email address so I can set up your profile.`,
      { parse_mode: 'Markdown' }
    );
    
    ctx.session = {
      ...(ctx.session || {}),
      authenticated: false,
      awaitingEmail: true,
      awaitingOTP: false,
      pendingPhone: normalizedPhone,
      userId: undefined,
      phoneNumber: undefined,
    };
    persistSessionState(chatId, ctx.session!);
    return;
  }
  
  ctx.session = {
    ...(ctx.session || {}),
    userId: user.id,
    phoneNumber: normalizedPhone,
    authenticated: false,
    awaitingEmail: false,
  };
  persistSessionState(chatId, ctx.session!);

  await ensureHederaAccountForUser(user.id);

  // Generate and send OTP
  const otp = await createOTP(normalizedPhone, 'telegram', chatId);
  
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
  
  ctx.session = {
    ...(ctx.session || {}),
    awaitingOTP: true,
    authenticated: false,
  };
  persistSessionState(chatId, ctx.session!);
});

// Handle phone number as text (fallback for manual entry)
bot.on('text', async (ctx: BotContext) => {
  if (!ctx.message || !('text' in ctx.message)) return;
  
  const text = ctx.message.text;
  const chatId = String(ctx.chat?.id);
  const isAuthed = !!ctx.session?.authenticated && !!ctx.session?.userId;

  if (ctx.session?.awaitingEmail && ctx.session.pendingPhone) {
    const emailCandidate = text.trim();

    if (!isValidEmail(emailCandidate)) {
      await ctx.reply('❌ That doesn’t look like a valid email. Please send a valid address like `name@example.com`.', {
        parse_mode: 'Markdown',
      });
      return;
    }

    await ctx.reply('⏳ Creating your Homebaise account...');

    try {
      const createdUser = await createUserWithPhoneAndEmail(
        ctx.session.pendingPhone,
        emailCandidate,
        ctx.from?.first_name || ctx.from?.username || undefined
      );

      await ensureHederaAccountForUser(createdUser.id);

      const otp = await createOTP(ctx.session.pendingPhone, 'telegram', chatId);

      await ctx.reply(
        `✅ Account created!\n\n` +
        `Your OTP is: *${otp}*\n\n` +
        `⚠️ For testing purposes only — please enter this code here to verify.`,
        { parse_mode: 'Markdown' }
      );

      ctx.session = {
        ...(ctx.session || {}),
        userId: createdUser.id,
        phoneNumber: ctx.session.pendingPhone,
        authenticated: false,
        awaitingEmail: false,
        awaitingOTP: true,
      };
      persistSessionState(chatId, ctx.session);
    } catch (error) {
      console.error('Failed to create user from email flow:', error);
      await ctx.reply(
        `❌ I ran into an issue setting up your account. Please try again or contact support if it persists.`
      );
    }

    return;
  }

  // NL invest: "invest $15 in Kigali Business Square"
  if (isAuthed) {
    const investMatch = text.match(/invest\s+\$?([\d_,\.]+)\s*(?:usd|dollars)?\s*(?:in|into|on)\s+(.+)/i);
    if (investMatch) {
      const rawAmount = investMatch[1].replace(/[, _]/g, '');
      const amount = Number(rawAmount);
      const titleQuery = investMatch[2].trim();

      if (!Number.isFinite(amount) || amount <= 0) {
        await ctx.reply('❌ Please provide a valid amount. Example: invest $15 in Kigali Business Square');
        return;
      }

      await ctx.reply(`⏳ Processing investment of $${amount.toFixed(2)} in "${titleQuery}" ...`);

      // Use signed server endpoint by title
      const { createInvestmentByTitle } = await import('../shared/api');
      const result = await createInvestmentByTitle(titleQuery, amount, ctx.session?.userId);
      if (!result.success) {
        await ctx.reply(`❌ Investment failed: ${result.error || 'Unknown error'}`);
        return;
      }

      const txId = result.transactionId || '';
      const hashscanUrl = txId ? `https://hashscan.io/testnet/transaction/${txId}` : '';

      let confirmation = `✅ Investment submitted!\n\n` +
        `Title: ${titleQuery}\n` +
        `Amount: $${amount.toFixed(2)}`;
      if (hashscanUrl) confirmation += `\n\n🔗 Hashscan: ${hashscanUrl}`;
      await ctx.reply(confirmation, { parse_mode: 'Markdown' });
      return;
    }
  }
  
  // Check if it's a phone number (starts with + and contains digits)
  if (text.match(/^\+\d{10,15}$/) && !ctx.session?.awaitingOTP) {
    console.log(`📱 Received phone number as text: ${text}`);
    const normalizedPhone = normalizePhoneNumber(text);

    const user = await getUserByPhone(normalizedPhone);

    if (!user) {
      await ctx.reply(
        `👋 I couldn't find an existing Homebaise account for *${normalizedPhone}*.\n\n` +
        `Please reply with your email address so I can create one for you.`,
        { parse_mode: 'Markdown' }
      );

      ctx.session = {
        ...(ctx.session || {}),
        authenticated: false,
        awaitingEmail: true,
        awaitingOTP: false,
        pendingPhone: normalizedPhone,
        userId: undefined,
        phoneNumber: undefined,
      };
      persistSessionState(chatId, ctx.session!);
      return;
    }

    await ensureHederaAccountForUser(user.id);

    const otp = await createOTP(normalizedPhone, 'telegram', chatId);

    await ctx.reply(
      `✅ Account found!\n\n` +
      `Welcome ${user.full_name || user.email || 'User'}!\n\n` +
      `Your OTP is: *${otp}*\n\n` +
      `⚠️ This is for testing only. In production, OTP will be sent via SMS.\n\n` +
      `Please enter this code to verify:`,
      { parse_mode: 'Markdown' }
    );

    ctx.session = {
      ...(ctx.session || {}),
      userId: user.id,
      phoneNumber: normalizedPhone,
      awaitingOTP: true,
      authenticated: false,
      awaitingEmail: false,
    };
    persistSessionState(chatId, ctx.session);
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
      await ensureHederaAccountForUser(result.userId);

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
          awaitingOTP: false,
          awaitingEmail: false,
        };
        persistSessionState(chatId, ctx.session);
        
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

        return;
      }
    } else {
      await ctx.reply(
        `❌ Invalid or expired OTP. Please try again with /start`
      );
      return;
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

