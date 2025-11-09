import { Telegraf, Context } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
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
  getUserProfile,
  getWalletSnapshot,
  getNotificationPreferences,
  updateNotificationPreferences,
  getRecentBotNotifications,
  NotificationPreferences,
  getUserByEmail,
  updateUserPhone,
} from '../shared/database';
import { createOTP, verifyOTP } from '../shared/auth';
import {
  getUserPortfolio,
  getWalletBalance,
  getProperties,
  transferHbarThroughBot,
  createInvestmentByTitle,
} from '../shared/api';
import { handleStart } from './handlers/start';
import { handleInvest } from './handlers/invest';
import {
  ACTIONS,
  buildMainMenuKeyboard,
  buildBackToMenuKeyboard,
  buildTransferConfirmKeyboard,
  buildAlertPreferencesKeyboard,
  buildOnboardingChoiceKeyboard,
  buildInvestAmountKeyboard,
} from './ui';
import { registerNotificationBridge } from './notifications';

interface TransferFlowData {
  amount?: number;
  recipientPhone?: string;
  recipientAccountId?: string;
  recipientLabel?: string;
  memo?: string;
}

type FlowState =
  | {
      type: 'TRANSFER';
      step: 'AMOUNT' | 'RECIPIENT' | 'CONFIRM';
      data: TransferFlowData;
    }
  | {
      type: 'ONBOARDING';
      step: 'CHOICE' | 'EMAIL_EXISTING' | 'EMAIL_NEW_OPTIONAL';
      data: {
        phone: string;
      };
    }
  | {
      type: 'INVEST';
      step: 'AMOUNT' | 'CUSTOM_AMOUNT';
      data: {
        propertyId: string;
        propertyName: string;
      };
    };

// Extend context to include user session
export interface BotContext extends Context {
  session?: {
    chatId?: string;
    userId?: string;
    phoneNumber?: string;
    authenticated?: boolean;
    awaitingOTP?: boolean;
    awaitingEmail?: boolean;
    pendingPhone?: string;
    flow?: FlowState;
  };
}

type SessionState = NonNullable<BotContext['session']>;
const sessionStore = new Map<string, SessionState>();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const propertyCache = new Map<
  string,
  { id: string; name: string; location: string; yieldRate: number; fundedPercent: number; totalValue: number; url?: string }
>();
const ACCOUNT_ID_REGEX = /^\d+\.\d+\.\d+$/;

function getSessionState(chatId: string): SessionState {
  return sessionStore.get(chatId) ?? {};
}

function persistSessionState(chatId: string, state: SessionState) {
  sessionStore.set(chatId, state);
}

function isValidEmail(value: string): boolean {
  return emailRegex.test(value.trim().toLowerCase());
}

function resetFlow(ctx: BotContext) {
  if (ctx.session) {
    ctx.session.flow = undefined;
  }
}

function findChatIdsForUser(userId: string): string[] {
  const chatIds: string[] = [];
  for (const [chatId, state] of sessionStore.entries()) {
    if (state.userId === userId) {
      chatIds.push(chatId);
    }
  }
  return chatIds;
}

function requireSession(ctx: BotContext): asserts ctx is BotContext & { session: SessionState } {
  if (!ctx.session) {
    ctx.session = {};
  }
}

async function ensureAuthenticatedForAction(ctx: BotContext): Promise<boolean> {
  if (!ctx.session?.authenticated || !ctx.session.userId) {
    await ctx.answerCbQuery('Please authenticate with /start first.', { show_alert: true }).catch(() => undefined);
    return false;
  }
  return true;
}

async function sendMainMenu(ctx: BotContext, message?: string) {
  await ctx.reply(
    message ??
      `👋 Welcome back${
        ctx.from?.first_name ? `, ${ctx.from.first_name}` : ''
      }!\nChoose an action to continue.`,
    {
      parse_mode: 'Markdown',
      reply_markup: buildMainMenuKeyboard(),
    }
  );
}

async function removeCustomKeyboard(ctx: BotContext) {
  await ctx.reply(' ', {
    reply_markup: {
      remove_keyboard: true,
    },
  }).catch(() => undefined);
}

async function finalizeAuthentication(
  ctx: BotContext,
  userId: string,
  phoneNumber?: string,
  welcomeMessage?: string
) {
  const chatId = String(ctx.chat?.id);

  const accountId = await ensureHederaAccountForUser(userId);
  try {
    await createBotSession(userId, 'telegram', chatId);
  } catch (error) {
    console.warn('Bot session creation issue (continuing):', error);
  }

  ctx.session = {
    ...(ctx.session || {}),
    chatId,
    userId,
    phoneNumber: phoneNumber || ctx.session?.phoneNumber,
    authenticated: true,
    awaitingOTP: false,
    awaitingEmail: false,
    flow: undefined,
  };
  persistSessionState(chatId, ctx.session);

  await removeCustomKeyboard(ctx);

  if (welcomeMessage) {
    await ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
  } else {
    await ctx.reply('✅ Account linked! You’re ready to start investing.', { parse_mode: 'Markdown' });
  }

  if (!accountId) {
    await ctx.reply(
      '⚠️ I could not verify your Hedera wallet automatically. You can connect one later from the web app.',
      { parse_mode: 'Markdown' }
    );
  }

  await sendMainMenu(ctx, '👇 Choose an action to continue:');
}

async function sendBalanceSummary(ctx: BotContext) {
  if (!ctx.session?.userId) {
    await ctx.reply('❌ I could not find your profile. Please authenticate again with /start.');
    return;
  }

  const balance = await getWalletBalance(ctx.session.userId);

  if (!balance) {
    await ctx.reply(
      `❌ Unable to load your balance right now.\n\nPlease ensure your account is fully set up in the Homebaise web app.`,
      { reply_markup: buildBackToMenuKeyboard() }
    );
    return;
  }

  let message = `💰 *Your Hedera Wallet*\n\n`;
  message += `💎 *HBAR Balance*: ${balance.hbarBalance.toFixed(4)} HBAR\n`;
  message += `💵 *USD Value*: ~$${balance.usdValue.toFixed(2)}\n`;

  if (balance.accountId) {
    message += `🆔 *Account ID*: \`${balance.accountId}\`\n`;
  } else {
    message += `🆔 *Account ID*: _Not linked yet_\n`;
  }

  if (balance.recentActivity.length > 0) {
    message += `\n📝 *Recent Activity*\n`;
    balance.recentActivity.slice(0, 5).forEach((activity) => {
      const emoji = activity.type === 'deposit' || activity.type === 'reward' ? '✅' : '❌';
      const sign = activity.type === 'deposit' || activity.type === 'reward' ? '+' : '-';
      message += `${emoji} ${sign}${activity.amount.toFixed(2)} HBAR · ${activity.type}\n`;
    });
  }

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: buildBackToMenuKeyboard(),
  });
}

async function sendTokensSummary(ctx: BotContext) {
  if (!ctx.session?.userId) {
    await ctx.reply('❌ I could not find your profile. Please authenticate again with /start.');
    return;
  }

  const portfolio = await getUserPortfolio(ctx.session.userId);

  if (!portfolio || portfolio.properties.length === 0) {
    await ctx.reply(
      `🎟️ You don't have any property tokens yet.
Explore opportunities under *View Properties*.`,
      {
        parse_mode: 'Markdown',
        reply_markup: buildBackToMenuKeyboard(),
      }
    );
    return;
  }

  const lines = portfolio.properties.slice(0, 5).map((property) => {
    return `• *${property.name}*
  Tokens: ${property.tokens}
  Invested: $${property.investment.toFixed(2)}`;
  });

  let message = `🎟️ *Your Tokens*

${lines.join('\n\n')}`;
  message += `\n\n_Total Invested_: $${portfolio.totalInvested.toFixed(2)}`;

  if (portfolio.properties.length > 5) {
    message += `\n…and ${portfolio.properties.length - 5} more holdings.`;
  }

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: buildBackToMenuKeyboard(),
  });
}

async function sendPropertiesOverview(ctx: BotContext) {
  const properties = await getProperties(config.bot.serverToken || '');

  const formatProperty = (property: any) => {
    const name = property.name || property.title || 'Unknown Property';
    const location = property.location || property.city || property.country || 'Unknown Location';
    const yieldRate = Number(property.yieldRate ?? property.expectedYield ?? property.apy ?? 0);
    const funded = Number(property.fundedPercent ?? property.funded_percent ?? property.fundingProgress ?? 0);
    const totalValue = Number(property.totalValue ?? property.targetAmount ?? property.price ?? 0);

    return {
      id: property.id || property.property_id || property.slug || name.replace(/\s+/g, '-').toLowerCase(),
      name,
      location,
      yieldRate: Number.isFinite(yieldRate) ? Number(yieldRate.toFixed(2)) : 0,
      fundedPercent: Number.isFinite(funded) ? Number(funded.toFixed(2)) : 0,
      totalValue: Number.isFinite(totalValue) ? totalValue : 0,
      url:
        property.slug
          ? `https://homebaise.vercel.app/properties/${property.slug}`
          : property.id
          ? `https://homebaise.vercel.app/properties/${property.id}`
          : undefined,
    };
  };

  const normalized = (properties || []).map(formatProperty).slice(0, 3);

  if (!normalized.length) {
    await ctx.reply('🏡 No properties are available at the moment. Please check back soon!', {
      reply_markup: buildBackToMenuKeyboard(),
    });
    return;
  }

  normalized.forEach((property) => {
    propertyCache.set(property.id, {
      id: property.id,
      name: property.name,
      location: property.location,
      yieldRate: property.yieldRate,
      fundedPercent: property.fundedPercent,
      totalValue: property.totalValue,
      url: property.url,
    });
  });

  const lines = normalized.map(
    (property) =>
      `• *${property.name}*\n  ${property.location}\n  Yield: ${property.yieldRate}% · Funded: ${property.fundedPercent}%`
  );

  const inlineKeyboard = [
    ...normalized.map((property) => {
      const viewButton = property.url
        ? ({ text: `🔍 View ${property.name}`, url: property.url } as InlineKeyboardButton)
        : ({ text: `🔍 View ${property.name}`, callback_data: `${ACTIONS.VIEW_PROPERTY_PREFIX}${property.id}` } as InlineKeyboardButton.CallbackButton);

      const investButton: InlineKeyboardButton.CallbackButton = {
        text: `💸 Invest in ${property.name}`,
        callback_data: `${ACTIONS.INVEST_PROPERTY_PREFIX}${property.id}`,
      };

      return [viewButton, investButton];
    }),
    [{ text: '⬅️ Back to Menu', callback_data: ACTIONS.SHOW_MENU }],
  ];

  await ctx.reply(`🏡 *Featured Opportunities*\n\n${lines.join('\n\n')}`, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: inlineKeyboard },
  });
}

async function sendAccountSummary(ctx: BotContext) {
  if (!ctx.session?.userId) {
    await ctx.reply('❌ I could not find your profile. Please authenticate again with /start.');
    return;
  }

  const [profile, wallet] = await Promise.all([
    getUserProfile(ctx.session.userId),
    getWalletSnapshot(ctx.session.userId),
  ]);

  if (!profile) {
    await ctx.reply('❌ Unable to load your profile. Please try again later.', {
      reply_markup: buildBackToMenuKeyboard(),
    });
    return;
  }

  const balance = wallet?.hbarBalance ?? 0;
  const usdValue = wallet?.usdValue ?? 0;

  let message = `🪪 *Your Homebaise Profile*\n\n`;
  message += `• *Name*: ${profile.full_name || 'Not set'}\n`;
  message += `• *Email*: ${profile.email || 'Not set'}\n`;
  message += `• *Phone*: ${profile.phone_number || 'Not set'}\n\n`;
  message += `💼 *Hedera Wallet*\n`;
  message += `• *Account ID*: ${
    wallet?.accountId ? `\`${wallet.accountId}\`` : '_Not linked yet_'
  }\n`;
  message += `• *Balance*: ${balance.toFixed(4)} HBAR (~$${usdValue.toFixed(2)})\n`;

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: buildBackToMenuKeyboard(),
  });
}

async function promptTransferAmount(ctx: BotContext) {
  await ctx.reply('💸 How much would you like to transfer? (HBAR)', {
    reply_markup: {
      inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: ACTIONS.FLOW_TRANSFER_CANCEL }]],
    },
  });
}

async function promptTransferRecipient(ctx: BotContext) {
  await ctx.reply(
    '👤 Who would you like to send it to?\n\n• Share their phone number with country code (e.g. +2348012345678)\n• Or provide a Hedera account ID (e.g. 0.0.123456)',
    {
      reply_markup: {
        inline_keyboard: [[{ text: '⬅️ Cancel', callback_data: ACTIONS.FLOW_TRANSFER_CANCEL }]],
      },
    }
  );
}

async function deliverTransferConfirmation(ctx: BotContext, flow: FlowState & { type: 'TRANSFER'; step: 'CONFIRM' }) {
  const { amount, recipientLabel, recipientAccountId, recipientPhone } = flow.data;
  let summary = `🔁 *Transfer Review*\n\n`;
  summary += `• *Amount*: ${amount?.toFixed(4)} HBAR\n`;
  summary += `• *Recipient*: ${recipientLabel || recipientPhone || recipientAccountId}\n`;
  summary += `• *Destination*: ${
    recipientAccountId ? `\`${recipientAccountId}\`` : recipientPhone || 'Pending account creation'
  }\n\n`;
  summary += `Ready to send the transfer?`;

  await ctx.reply(summary, {
    parse_mode: 'Markdown',
    reply_markup: buildTransferConfirmKeyboard(),
  });
}

async function startTransferFlow(ctx: BotContext) {
  requireSession(ctx);

  if (!ctx.session.authenticated || !ctx.session.userId) {
    await ctx.reply('🔐 Please authenticate first using /start.');
    return;
  }

  const accountId = await ensureHederaAccountForUser(ctx.session.userId);
  if (!accountId) {
    await ctx.reply(
      '⚠️ I could not find a Hedera wallet on your profile. Please connect one in the Homebaise web app first.'
    );
    return;
  }

  ctx.session.flow = {
    type: 'TRANSFER',
    step: 'AMOUNT',
    data: { amount: undefined, recipientAccountId: undefined, recipientPhone: undefined },
  };
  persistSessionState(ctx.session.chatId!, ctx.session);

  await promptTransferAmount(ctx);
}

async function cancelTransferFlow(ctx: BotContext, message?: string) {
  resetFlow(ctx);
  if (ctx.session?.chatId) {
    persistSessionState(ctx.session.chatId, ctx.session);
  }
  await ctx.reply(message ?? 'Transfer cancelled. No changes were made.', {
    reply_markup: buildBackToMenuKeyboard(),
  });
}

async function completeTransferFlow(ctx: BotContext) {
  const flow = ctx.session?.flow;
  if (!flow || flow.type !== 'TRANSFER' || flow.step !== 'CONFIRM') {
    await ctx.reply('⚠️ I could not confirm the transfer. Please start again from the menu.');
    resetFlow(ctx);
    if (ctx.session?.chatId) persistSessionState(ctx.session.chatId, ctx.session);
    return;
  }

  const { amount, recipientAccountId, recipientPhone, recipientLabel } = flow.data;

  if (!ctx.session?.userId || !amount || (!recipientAccountId && !recipientPhone)) {
    await ctx.reply('⚠️ Transfer details incomplete. Please start again.');
    resetFlow(ctx);
    if (ctx.session?.chatId) persistSessionState(ctx.session.chatId, ctx.session);
    return;
  }

  await ctx.reply('🚀 Executing transfer...');

  const result = await transferHbarThroughBot({
    senderId: ctx.session.userId,
    amount,
    recipientAccountId,
    recipientPhone,
  });

  if (!result.success) {
    await ctx.reply(`❌ Transfer failed: ${result.error || 'Unknown error'}`, {
      reply_markup: buildBackToMenuKeyboard(),
    });
    resetFlow(ctx);
    if (ctx.session?.chatId) persistSessionState(ctx.session.chatId, ctx.session);
    return;
  }

  let message = `✅ *Transfer Complete!*\n\n`;
  message += `• *Amount*: ${amount.toFixed(4)} HBAR\n`;
  message += `• *Recipient*: ${recipientLabel || recipientPhone || result.receiverAccountId}\n`;
  message += `• *Account ID*: \`${result.receiverAccountId}\`\n`;

  if (result.hashscanUrl) {
    message += `\n🔗 [View on Hashscan](${result.hashscanUrl})`;
  }

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: buildBackToMenuKeyboard(),
  });

  resetFlow(ctx);
  if (ctx.session?.chatId) persistSessionState(ctx.session.chatId, ctx.session);
}

async function handleTransferFlowInput(ctx: BotContext, text: string) {
  const flow = ctx.session?.flow;
  if (!flow || flow.type !== 'TRANSFER') return;

  const chatId = ctx.session?.chatId;

  if (flow.step === 'AMOUNT') {
    const normalized = text.replace(/[^\d.,]/g, '').replace(',', '.');
    const amount = Number(normalized);

    if (!Number.isFinite(amount) || amount <= 0) {
      await ctx.reply('❌ Please enter a valid positive amount in HBAR (e.g. 5 or 12.5).');
      return;
    }

    flow.data.amount = amount;
    flow.step = 'RECIPIENT';
    if (chatId) persistSessionState(chatId, ctx.session!);

    await promptTransferRecipient(ctx);
    return;
  }

  if (flow.step === 'RECIPIENT') {
    const normalizedInput = text.replace(/\s+/g, '');

    if (ACCOUNT_ID_REGEX.test(normalizedInput)) {
      flow.data.recipientAccountId = normalizedInput;
      flow.data.recipientPhone = undefined;
      flow.data.recipientLabel = normalizedInput;
      flow.step = 'CONFIRM';
      if (chatId) persistSessionState(chatId, ctx.session!);
      await deliverTransferConfirmation(ctx, flow as FlowState & { type: 'TRANSFER'; step: 'CONFIRM' });
      return;
    }

    if (/^\+?\d{7,15}$/.test(normalizedInput)) {
      const phone = normalizePhoneNumber(normalizedInput);
      const recipient = await getUserByPhone(phone);

      if (!recipient) {
        await ctx.reply(
          `❌ I couldn't find a Homebaise user with phone number *${phone}*.\n` +
            `Ask them to register first or provide a Hedera account ID.`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      flow.data.recipientPhone = phone;
      flow.data.recipientLabel = recipient.full_name || recipient.email || phone;

      const profile = await getUserProfile(recipient.id);
      flow.data.recipientAccountId = profile?.hedera_account_id ?? undefined;

      flow.step = 'CONFIRM';
      if (chatId) persistSessionState(chatId, ctx.session!);

      await deliverTransferConfirmation(ctx, flow as FlowState & { type: 'TRANSFER'; step: 'CONFIRM' });
      return;
    }

    await ctx.reply(
      '❌ Recipient must be a valid phone number with country code or a Hedera account ID.\nPlease try again.'
    );
    return;
  }

  if (flow.step === 'CONFIRM') {
    const trimmed = text.trim().toLowerCase();
    if (['cancel', 'stop', 'exit'].includes(trimmed)) {
      await cancelTransferFlow(ctx, '✅ Transfer cancelled.');
      return;
    }

    if (['confirm', 'yes', 'send'].includes(trimmed)) {
      await completeTransferFlow(ctx);
      return;
    }

    await ctx.reply('ℹ️ Please tap *Confirm* or *Cancel* below.', { parse_mode: 'Markdown' });
  }
}

async function sendAlertPreferences(ctx: BotContext) {
  if (!ctx.session?.userId) {
    await ctx.reply('❌ Please authenticate first using /start.');
    return;
  }

  const preferences = await getNotificationPreferences(ctx.session.userId);

  if (!preferences) {
    await ctx.reply('⚠️ Unable to load notification settings right now. Please try again later.');
    return;
  }

  const message =
    `🔔 *Notification Preferences*\n\n` +
    `Toggle which alerts you want to receive in Telegram.`;

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: buildAlertPreferencesKeyboard(preferences),
  });
}

async function toggleAlertPreference(ctx: BotContext, key: keyof NotificationPreferences) {
  if (!ctx.session?.userId) return;

  const preferences = await getNotificationPreferences(ctx.session.userId);
  if (!preferences) {
    await ctx.answerCbQuery('Unable to load preferences. Try again later.', { show_alert: true });
    return;
  }

  const nextValue = !preferences[key];
  const updated = await updateNotificationPreferences(ctx.session.userId, {
    [key]: nextValue,
  } as Partial<NotificationPreferences>);

  if (!updated) {
    await ctx.answerCbQuery('Failed to update preference.', { show_alert: true });
    return;
  }

  await ctx.editMessageReplyMarkup(buildAlertPreferencesKeyboard(updated)).catch(() => undefined);
  await ctx.answerCbQuery(`${key.replace(/_/g, ' ')} ${nextValue ? 'enabled' : 'disabled'}.`);
}

async function sendActivityFeed(ctx: BotContext) {
  if (!ctx.session?.userId) {
    await ctx.reply('❌ Please authenticate first using /start.');
    return;
  }

  const notifications = await getRecentBotNotifications(ctx.session.userId, 5);

  if (!notifications || notifications.length === 0) {
    await ctx.reply('📭 No recent activity yet. I’ll let you know when something happens!', {
      reply_markup: buildBackToMenuKeyboard(),
    });
    return;
  }

  const lines = notifications.map((notif) => {
    const date = new Date(notif.created_at ?? new Date()).toLocaleString();
    return `• *${notif.title || 'Notification'}*\n  ${notif.message || ''}\n  _${date}_`;
  });

  await ctx.reply(`📰 *Recent Activity*\n\n${lines.join('\n\n')}`, {
    parse_mode: 'Markdown',
    reply_markup: buildBackToMenuKeyboard(),
  });
}

async function sendSupportOptions(ctx: BotContext) {
  await ctx.reply(
    `🛎️ *Need help?*\n\n` +
      `• Visit the Help Center: https://homebaise.vercel.app/help\n` +
      `• Email support: support@homebaise.com\n` +
      `• Join the Community: https://t.me/homebaise`,
    {
      parse_mode: 'Markdown',
      reply_markup: buildBackToMenuKeyboard(),
    }
  );
}

async function startInvestFlowForProperty(ctx: BotContext, propertyId: string) {
  if (!ctx.session?.userId) {
    await ctx.reply('❌ Please authenticate first using /start.');
    return;
  }

  const cached = propertyCache.get(propertyId);
  if (!cached) {
    await ctx.reply('⚠️ I could not find that property. Please refresh the list.');
    return;
  }

  ctx.session.flow = {
    type: 'INVEST',
    step: 'AMOUNT',
    data: {
      propertyId,
      propertyName: cached.name,
    },
  };
  if (ctx.session.chatId) persistSessionState(ctx.session.chatId, ctx.session);

  await ctx.reply(
    `💸 *${cached.name}*\nHow much would you like to invest?`,
    {
      parse_mode: 'Markdown',
      reply_markup: buildInvestAmountKeyboard(propertyId, cached.name),
    }
  );
}

async function completeInvestment(ctx: BotContext, propertyId: string, amountUsd: number) {
  if (!ctx.session?.userId) return;

  const cached = propertyCache.get(propertyId);
  if (!cached) {
    await ctx.reply('⚠️ I could not find that property. Please refresh the list.');
    return;
  }

  await ctx.reply(`⏳ Investing $${amountUsd.toFixed(2)} into ${cached.name}...`);

  const result = await createInvestmentByTitle(cached.name, amountUsd, ctx.session.userId);

  if (!result.success) {
    await ctx.reply(`❌ Investment failed: ${result.error || 'Unknown error'}`, {
      reply_markup: buildBackToMenuKeyboard(),
    });
    ctx.session.flow = undefined;
    if (ctx.session.chatId) persistSessionState(ctx.session.chatId, ctx.session);
    return;
  }

  const hashscanUrl = result.transactionId
    ? `https://hashscan.io/testnet/transaction/${result.transactionId}`
    : undefined;

  let confirmation = `✅ *Investment submitted!*\n\n`;
  confirmation += `• Property: ${cached.name}\n`;
  confirmation += `• Amount: $${amountUsd.toFixed(2)}`;
  if (hashscanUrl) {
    confirmation += `\n\n🔗 [View on Hashscan](${hashscanUrl})`;
  }

  await ctx.reply(confirmation, {
    parse_mode: 'Markdown',
    reply_markup: buildBackToMenuKeyboard(),
  });

  ctx.session.flow = undefined;
  if (ctx.session.chatId) persistSessionState(ctx.session.chatId, ctx.session);
}

// Initialize bot with custom options
const bot = new Telegraf<BotContext>(config.telegram.token, {
  telegram: {
    apiRoot: 'https://api.telegram.org',
    webhookReply: false,
  },
});

registerNotificationBridge(bot, findChatIdsForUser);

// Session middleware
bot.use(async (ctx: BotContext, next) => {
  const chatId = ctx.chat?.id ? String(ctx.chat.id) : undefined;

  if (!chatId) {
    await next();
    return;
  }

  const state = getSessionState(chatId);
  state.chatId = chatId;

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
    await ctx.reply('🔐 Please authenticate first using /start.');
    return;
  }
  await next();
};

// Command handlers (backwards compatibility)
bot.start(handleStart);
bot.command('portfolio', requireAuth, async (ctx) => {
  await sendTokensSummary(ctx);
});
bot.command('balance', requireAuth, async (ctx) => {
  await sendBalanceSummary(ctx);
});
bot.command('browse', requireAuth, async (ctx) => {
  await sendPropertiesOverview(ctx);
});
bot.command('invest', requireAuth, handleInvest);
bot.command('transfer', requireAuth, async (ctx) => {
  await startTransferFlow(ctx);
});
bot.command('account', requireAuth, async (ctx) => {
  await sendAccountSummary(ctx);
});
bot.command('help', async (ctx) => {
  if (ctx.session?.authenticated) {
    await sendMainMenu(ctx, '👇 Quick actions:');
  } else {
    await ctx.reply(
      '👋 Hi! Share your phone number via /start so I can link your Homebaise account.',
      { reply_markup: buildMainMenuKeyboard() }
    );
  }
});

// Inline actions
bot.action(ACTIONS.SHOW_MENU, async (ctx) => {
  await ctx.answerCbQuery().catch(() => undefined);
  await sendMainMenu(ctx, '👇 Choose what to do next:');
});

bot.action(ACTIONS.CHECK_BALANCE, async (ctx) => {
  if (!(await ensureAuthenticatedForAction(ctx))) return;
  await ctx.answerCbQuery().catch(() => undefined);
  await sendBalanceSummary(ctx);
});

bot.action(ACTIONS.VIEW_TOKENS, async (ctx) => {
  if (!(await ensureAuthenticatedForAction(ctx))) return;
  await ctx.answerCbQuery().catch(() => undefined);
  await sendTokensSummary(ctx);
});

bot.action(ACTIONS.VIEW_ACCOUNT, async (ctx) => {
  if (!(await ensureAuthenticatedForAction(ctx))) return;
  await ctx.answerCbQuery().catch(() => undefined);
  await sendAccountSummary(ctx);
});

bot.action(ACTIONS.VIEW_PROPERTIES, async (ctx) => {
  if (!(await ensureAuthenticatedForAction(ctx))) return;
  await ctx.answerCbQuery().catch(() => undefined);
  await sendPropertiesOverview(ctx);
});

bot.action(ACTIONS.TRANSFER_FUNDS, async (ctx) => {
  if (!(await ensureAuthenticatedForAction(ctx))) return;
  await ctx.answerCbQuery().catch(() => undefined);
  await startTransferFlow(ctx);
});

bot.action(ACTIONS.FLOW_TRANSFER_CANCEL, async (ctx) => {
  await ctx.answerCbQuery().catch(() => undefined);
  await cancelTransferFlow(ctx, '✅ Transfer cancelled.');
});

bot.action(ACTIONS.FLOW_TRANSFER_CONFIRM, async (ctx) => {
  if (!(await ensureAuthenticatedForAction(ctx))) return;
  await ctx.answerCbQuery().catch(() => undefined);
  await completeTransferFlow(ctx);
});

bot.action(ACTIONS.MANAGE_ALERTS, async (ctx) => {
  if (!(await ensureAuthenticatedForAction(ctx))) return;
  await ctx.answerCbQuery().catch(() => undefined);
  await sendAlertPreferences(ctx);
});

bot.action(ACTIONS.VIEW_ACTIVITY, async (ctx) => {
  if (!(await ensureAuthenticatedForAction(ctx))) return;
  await ctx.answerCbQuery().catch(() => undefined);
  await sendActivityFeed(ctx);
});

bot.action(ACTIONS.GET_SUPPORT, async (ctx) => {
  await ctx.answerCbQuery().catch(() => undefined);
  await sendSupportOptions(ctx);
});

bot.action(ACTIONS.ONBOARD_EXISTING, async (ctx) => {
  await ctx.answerCbQuery().catch(() => undefined);
  if (!ctx.session?.flow || ctx.session.flow.type !== 'ONBOARDING') return;
  ctx.session.flow.step = 'EMAIL_EXISTING';
  if (ctx.session.chatId) persistSessionState(ctx.session.chatId, ctx.session);
  await ctx.reply('📧 Great! Please enter the email associated with your Homebaise account.');
});

bot.action(ACTIONS.ONBOARD_NEW, async (ctx) => {
  await ctx.answerCbQuery().catch(() => undefined);
  if (!ctx.session?.flow || ctx.session.flow.type !== 'ONBOARDING') return;
  ctx.session.flow.step = 'EMAIL_NEW_OPTIONAL';
  if (ctx.session.chatId) persistSessionState(ctx.session.chatId, ctx.session);
  await ctx.reply('📧 Let’s create an account. Enter your email (or type “skip” to continue without one).');
});

bot.action(new RegExp(`^${ACTIONS.ALERT_TOGGLE_PREFIX}`), async (ctx) => {
  if (!(await ensureAuthenticatedForAction(ctx))) return;
  const callbackData =
    ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
  const key = callbackData?.replace(ACTIONS.ALERT_TOGGLE_PREFIX, '') as keyof NotificationPreferences | undefined;

  if (!key) {
    await ctx.answerCbQuery('Unknown preference', { show_alert: true });
    return;
  }

  await toggleAlertPreference(ctx, key);
});

bot.action(new RegExp(`^${ACTIONS.INVEST_PROPERTY_PREFIX}`), async (ctx) => {
  if (!(await ensureAuthenticatedForAction(ctx))) return;
  await ctx.answerCbQuery().catch(() => undefined);

  const callbackData =
    ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
  const propertyId = callbackData?.replace(ACTIONS.INVEST_PROPERTY_PREFIX, '');

  if (!propertyId) {
    await ctx.reply('⚠️ Unable to identify the property. Please try again.');
    return;
  }

  const property = propertyCache.get(propertyId);

  if (!property) {
    await ctx.reply('❌ I could not find that property. Please refresh the list.');
    return;
  }

  await startInvestFlowForProperty(ctx, propertyId);
});

bot.action(new RegExp(`^${ACTIONS.INVEST_QUICK_PREFIX}`), async (ctx) => {
  if (!(await ensureAuthenticatedForAction(ctx))) return;
  await ctx.answerCbQuery().catch(() => undefined);
  const callbackData =
    ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
  const payload = callbackData?.replace(ACTIONS.INVEST_QUICK_PREFIX, '');
  const [propertyId, amountStr] = (payload || '').split(':');
  const amount = Number(amountStr);
  if (!propertyId || !Number.isFinite(amount) || amount <= 0) {
    await ctx.reply('⚠️ Invalid amount selected.');
    return;
  }
  await completeInvestment(ctx, propertyId, amount);
});

bot.action(new RegExp(`^${ACTIONS.INVEST_CUSTOM}`), async (ctx) => {
  if (!(await ensureAuthenticatedForAction(ctx))) return;
  await ctx.answerCbQuery().catch(() => undefined);
  const callbackData =
    ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
  const [, propertyId] = (callbackData || '').split(':');
  if (!propertyId) {
    await ctx.reply('⚠️ Could not determine the property. Please try again.');
    return;
  }
  if (!ctx.session) ctx.session = {} as SessionState;
  ctx.session.flow = {
    type: 'INVEST',
    step: 'CUSTOM_AMOUNT',
    data: {
      propertyId,
      propertyName: propertyCache.get(propertyId)?.name || 'Selected Property',
    },
  };
  if (ctx.session.chatId) persistSessionState(ctx.session.chatId, ctx.session);
  await ctx.reply('✏️ Enter the amount in USD you would like to invest.');
});

bot.action(new RegExp(`^${ACTIONS.VIEW_PROPERTY_PREFIX}`), async (ctx) => {
  if (!(await ensureAuthenticatedForAction(ctx))) return;
  await ctx.answerCbQuery().catch(() => undefined);

  const callbackData =
    ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
  const propertyId = callbackData?.replace(ACTIONS.VIEW_PROPERTY_PREFIX, '');

  let property = propertyId ? propertyCache.get(propertyId) : undefined;

  if (!property && propertyId) {
    const properties = await getProperties(config.bot.serverToken || '');
    const fallback = properties?.find((item) => String(item.id) === propertyId);
    if (fallback) {
      property = {
        id: propertyId,
        name: fallback.name || fallback.title || 'Unknown Property',
        location: fallback.location || fallback.city || fallback.country || 'Unknown Location',
        yieldRate: Number(fallback.yieldRate ?? fallback.expectedYield ?? 0),
        fundedPercent: Number(fallback.fundedPercent ?? fallback.funded_percent ?? 0),
        totalValue: Number(fallback.totalValue ?? fallback.targetAmount ?? fallback.price ?? 0),
        url: fallback.slug
          ? `https://homebaise.vercel.app/properties/${fallback.slug}`
          : `https://homebaise.vercel.app/properties/${fallback.id}`,
      };
      propertyCache.set(propertyId, property);
    }
  }

  if (!property) {
    await ctx.reply('❌ I could not load that property. Please try again later.', {
      reply_markup: buildBackToMenuKeyboard(),
    });
    return;
  }

  const valueLabel = property.totalValue > 0 ? `$${property.totalValue.toLocaleString()}` : 'N/A';

  const message =
    `🏠 *${property.name}*\n` +
    `${property.location}\n\n` +
    `• Value: ${valueLabel}\n` +
    `• Yield: ${property.yieldRate}%\n` +
    `• Funded: ${property.fundedPercent}%\n\n` +
    `_Tap "Invest" below to participate from Telegram or open the property in the web app._`;

  const inline_keyboard = [
    [
      property.url
        ? { text: '🌐 Open in Web', url: property.url }
        : { text: '🌐 Open in Web', url: 'https://homebaise.vercel.app/properties' },
      { text: '💸 Invest Now', callback_data: `${ACTIONS.INVEST_PROPERTY_PREFIX}${property.id}` },
    ],
    [{ text: '⬅️ Back to Menu', callback_data: ACTIONS.SHOW_MENU }],
  ];

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard },
  });
});

bot.action(new RegExp(`^${ACTIONS.INVEST_PROPERTY_PREFIX}`), async (ctx) => {
  if (!(await ensureAuthenticatedForAction(ctx))) return;
  await ctx.answerCbQuery().catch(() => undefined);

  const callbackData =
    ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
  const propertyId = callbackData?.replace(ACTIONS.INVEST_PROPERTY_PREFIX, '');

  if (!propertyId) {
    await ctx.reply('⚠️ Unable to identify the property. Please try again.');
    return;
  }

  const property = propertyCache.get(propertyId);

  if (!property) {
    await ctx.reply('❌ I could not find that property. Please refresh the list.');
    return;
  }

  await startInvestFlowForProperty(ctx, propertyId);
});

// Handle contact/phone number
bot.on('contact', async (ctx: BotContext) => {
  if (!ctx.message || !('contact' in ctx.message)) return;

  requireSession(ctx);

  const chatId = String(ctx.chat?.id);
  const phoneNumber = ctx.message.contact.phone_number;

  console.log(`📱 Received contact from Telegram: ${phoneNumber}`);

  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const user = await getUserByPhone(phoneNumber);

  ctx.session = {
    ...(ctx.session || {}),
    chatId,
    pendingPhone: normalizedPhone,
    flow: undefined,
  };

  if (!user) {
    await ctx.reply(
      `👋 I couldn't find an existing Homebaise account for *${normalizedPhone}*.`,
      { parse_mode: 'Markdown' }
    );
    await ctx.reply('Do you already have an account?', {
      reply_markup: buildOnboardingChoiceKeyboard(),
    });

    ctx.session.flow = {
      type: 'ONBOARDING',
      step: 'CHOICE',
      data: { phone: normalizedPhone },
    };
    ctx.session.awaitingEmail = false;
    ctx.session.awaitingOTP = false;
    ctx.session.authenticated = false;
    ctx.session.userId = undefined;
    ctx.session.phoneNumber = undefined;
    persistSessionState(chatId, ctx.session);
    return;
  }

  const otp = await createOTP(normalizedPhone, 'telegram', chatId);

  ctx.session.userId = user.id;
  ctx.session.phoneNumber = normalizedPhone;
  ctx.session.authenticated = false;
  ctx.session.awaitingOTP = true;
  ctx.session.awaitingEmail = false;
  ctx.session.flow = undefined;
  persistSessionState(chatId, ctx.session);

  await removeCustomKeyboard(ctx);

  await ctx.reply(
    `✅ Account found!

Welcome ${user.full_name || user.email || 'Homebaise investor'}!

Your OTP is: *${otp}*

⚠️ This is for testing only. In production, OTP will be sent via SMS.

Please enter this code to verify.`,
    { parse_mode: 'Markdown' }
  );
});

// Handle text input (auth flows, NL commands, conversational flows)
bot.on('text', async (ctx: BotContext) => {
  if (!ctx.message || !('text' in ctx.message)) return;

  requireSession(ctx);

  const text = ctx.message.text.trim();
  const chatId = String(ctx.chat?.id);
  const isAuthed = !!ctx.session?.authenticated && !!ctx.session?.userId;

  const activeFlow = ctx.session.flow;

  if (activeFlow?.type === 'ONBOARDING') {
    if (activeFlow.step === 'EMAIL_EXISTING') {
      if (!isValidEmail(text)) {
        await ctx.reply('❌ That doesn’t look like a valid email. Please enter the email linked to your Homebaise account.');
        return;
      }

      const userRecord = await getUserByEmail(text);
      if (!userRecord) {
        await ctx.reply('❌ No Homebaise account found with that email. Double-check and try again, or choose “Create a new account”.');
        return;
      }

      const phone = activeFlow.data.phone;
      await updateUserPhone(userRecord.id, phone);
      const otp = await createOTP(phone, 'telegram', chatId);

      ctx.session.userId = userRecord.id;
      ctx.session.phoneNumber = phone;
      ctx.session.awaitingOTP = true;
      ctx.session.awaitingEmail = false;
      ctx.session.authenticated = false;
      ctx.session.flow = undefined;
      persistSessionState(chatId, ctx.session);

      await removeCustomKeyboard(ctx);
      await ctx.reply(
        `✅ Email confirmed!

Your OTP is: *${otp}*

⚠️ This is for testing purposes only. Please enter this code to verify your account.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    if (activeFlow.step === 'EMAIL_NEW_OPTIONAL') {
      const shouldSkip = text.toLowerCase() === 'skip';
      if (!shouldSkip && text && !isValidEmail(text)) {
        await ctx.reply('❌ That doesn’t look like a valid email. Enter a proper email or type “skip” to continue without one.');
        return;
      }

      await ctx.reply('⏳ Creating your Homebaise account...');
      try {
        const createdUser = await createUserWithPhoneAndEmail(
          activeFlow.data.phone,
          shouldSkip ? '' : text,
          ctx.from?.first_name || ctx.from?.username || undefined
        );

        const otp = await createOTP(activeFlow.data.phone, 'telegram', chatId);

        ctx.session.userId = createdUser.id;
        ctx.session.phoneNumber = activeFlow.data.phone;
        ctx.session.awaitingOTP = true;
        ctx.session.awaitingEmail = false;
        ctx.session.authenticated = false;
        ctx.session.flow = undefined;
        persistSessionState(chatId, ctx.session);

        await removeCustomKeyboard(ctx);
        await ctx.reply(
          `✅ Account created!

Your OTP is: *${otp}*

⚠️ This is for testing only. Please enter this code to verify and start investing.`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Failed to create user from onboarding flow:', error);
        await ctx.reply('❌ I ran into an issue setting up your account. Please try again or contact support.');
      }
      return;
    }
  }

  if (activeFlow?.type === 'INVEST') {
    if (activeFlow.step === 'CUSTOM_AMOUNT') {
      const normalized = text.replace(/[^\d.,]/g, '').replace(',', '.');
      const amount = Number(normalized);
      if (!Number.isFinite(amount) || amount <= 0) {
        await ctx.reply('❌ Please enter a valid USD amount (e.g. 25 or 100).');
        return;
      }
      await completeInvestment(ctx, activeFlow.data.propertyId, amount);
    }
    return;
  }

  if (activeFlow?.type === 'TRANSFER') {
    await handleTransferFlowInput(ctx, text);
    return;
  }

  if (ctx.session.awaitingOTP) {
    console.log(`🔐 OTP verification attempt: "${text}" for chat ${chatId}`);

    const result = await verifyOTP('telegram', chatId, text);
    console.log(`🔐 OTP verification result:`, result);

    if (result.success && result.userId) {
      await finalizeAuthentication(
        ctx,
        result.userId,
        result.phoneNumber,
        `✅ *Authentication successful!*\n\nWelcome to Homebaise 🎉\nChoose what you'd like to do next.`
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
    } else {
      await ctx.reply(`❌ Invalid or expired OTP. Please try again with /start`);
    }
    return;
  }

  if (isAuthed) {
    const investMatch = text.match(/invest\s+\$?([\d_,\.]+)\s*(?:usd|dollars)?\s*(?:in|into|on)\s+(.+)/i);
    if (investMatch) {
      const rawAmount = investMatch[1].replace(/[,_]/g, '');
      const amount = Number(rawAmount);
      const titleQuery = investMatch[2].trim();

      if (!Number.isFinite(amount) || amount <= 0) {
        await ctx.reply('❌ Please provide a valid amount. Example: invest $15 in Kigali Business Square');
        return;
      }

      await ctx.reply(`⏳ Processing investment of $${amount.toFixed(2)} in "${titleQuery}" ...`);

      const result = await createInvestmentByTitle(titleQuery, amount, ctx.session?.userId);
      if (!result.success) {
        await ctx.reply(`❌ Investment failed: ${result.error || 'Unknown error'}`);
        return;
      }

      const txId = result.transactionId || '';
      const hashscanUrl = txId ? `https://hashscan.io/testnet/transaction/${txId}` : '';

      let confirmation = `✅ Investment submitted!

` + `Title: ${titleQuery}
` + `Amount: $${amount.toFixed(2)}`;
      if (hashscanUrl) confirmation += `

🔗 Hashscan: ${hashscanUrl}`;
      await ctx.reply(confirmation, { parse_mode: 'Markdown' });
      return;
    }
  }

  if (/^\+\d{10,15}$/.test(text) && !ctx.session.awaitingOTP) {
    console.log(`📱 Received phone number as text: ${text}`);
    const normalizedPhone = normalizePhoneNumber(text);

    const user = await getUserByPhone(normalizedPhone);

    if (!user) {
      await ctx.reply(
        `👋 I couldn't find an existing Homebaise account for *${normalizedPhone}*.

Please reply with your email address or type "skip" to create a new account without email.`,
        { parse_mode: 'Markdown' }
      );

      ctx.session.flow = {
        type: 'ONBOARDING',
        step: 'EMAIL_NEW_OPTIONAL',
        data: { phone: normalizedPhone },
      };
      ctx.session.awaitingOTP = false;
      ctx.session.authenticated = false;
      ctx.session.userId = undefined;
      ctx.session.phoneNumber = undefined;
      persistSessionState(chatId, ctx.session);
      return;
    }

    const otp = await createOTP(normalizedPhone, 'telegram', chatId);

    ctx.session.userId = user.id;
    ctx.session.phoneNumber = normalizedPhone;
    ctx.session.awaitingOTP = true;
    ctx.session.authenticated = false;
    ctx.session.flow = undefined;
    persistSessionState(chatId, ctx.session);

    await removeCustomKeyboard(ctx);
    await ctx.reply(
      `✅ Account found!

Welcome ${user.full_name || user.email || 'User'}!

Your OTP is: *${otp}*

⚠️ This is for testing only. Please enter this code to verify.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  if (isAuthed) {
    await ctx.reply('💡 Use the quick action buttons below to continue.', {
      reply_markup: buildMainMenuKeyboard(),
    });
  } else {
    await ctx.reply('ℹ️ Please send /start and share your contact so I can verify your account.');
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
    contact: ctx.message && 'contact' in ctx.message ? 'Contact shared' : 'No contact',
  });
  return next();
});

// Start bot (only if this file is run directly or if token is configured)
export function startTelegramBot() {
  if (config.telegram.token) {
    console.log('🤖 Starting Telegram bot with token:', config.telegram.token.substring(0, 10) + '...');

    bot.launch()
      .then(() => {
        console.log('✅ Telegram bot started successfully');
        console.log('📱 Bot is ready to receive messages!');
      })
      .catch((error) => {
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
try {
  // @ts-ignore - require.main check for CommonJS compatibility
  if (typeof require !== 'undefined' && require.main === module) {
    startTelegramBot();
  }
} catch {
  // Ignore if require is not available (ESM mode)
}

export { bot };

