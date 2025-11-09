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
  getUserProfile,
  getWalletSnapshot,
  getNotificationPreferences,
  updateNotificationPreferences,
  getRecentBotNotifications,
  NotificationPreferences,
} from '../shared/database';
import { createOTP, verifyOTP } from '../shared/auth';
import {
  getUserPortfolio,
  getWalletBalance,
  getProperties,
  transferHbarThroughBot,
} from '../shared/api';
import { handleStart } from './handlers/start';
import { handleInvest } from './handlers/invest';
import {
  ACTIONS,
  buildMainMenuKeyboard,
  buildBackToMenuKeyboard,
  buildTransferConfirmKeyboard,
  buildAlertPreferencesKeyboard,
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

  const lines = normalized.map(
    (property) =>
      `• *${property.name}*\n  ${property.location}\n  Yield: ${property.yieldRate}% · Funded: ${property.fundedPercent}%`
  );

  const inlineKeyboard = [
    ...normalized.map((property) => [
      property.url
        ? { text: `🔍 View ${property.name}`, url: property.url }
        : {
            text: `🔍 View ${property.name}`,
            callback_data: `${ACTIONS.VIEW_PROPERTY_PREFIX}${property.id}`,
          },
    ]),
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

bot.action(new RegExp(`^${ACTIONS.VIEW_PROPERTY_PREFIX}`), async (ctx) => {
  if (!(await ensureAuthenticatedForAction(ctx))) return;
  await ctx.answerCbQuery().catch(() => undefined);

  const callbackData =
    ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : undefined;
  const propertyId = callbackData?.replace(ACTIONS.VIEW_PROPERTY_PREFIX, '');
  const properties = await getProperties(config.bot.serverToken || '');
  const property = properties?.find((item) => String(item.id) === propertyId);

  if (!property) {
    await ctx.reply('❌ I could not load that property. Please try again later.', {
      reply_markup: buildBackToMenuKeyboard(),
    });
    return;
  }

  const message =
    `🏠 *${property.name}*\n` +
    `${property.location}\n\n` +
    `• Value: $${property.totalValue.toLocaleString()}\n` +
    `• Yield: ${property.yieldRate}%\n` +
    `• Funded: ${property.fundedPercent}%\n\n` +
    `_Tap "Invest" in the web app to participate._`;

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🌐 Open in Web',
            url: `https://homebaise.vercel.app/properties/${property.id}`,
          },
        ],
        [{ text: '⬅️ Back to Menu', callback_data: ACTIONS.SHOW_MENU }],
      ],
    },
  });
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

  if (!user) {
    await ctx.reply(
      `👋 I couldn't find an existing Homebaise account for *${normalizedPhone}*.\n\n` +
        `Let's create one real quick!\n\n` +
        `Please reply with your email address so I can set up your profile.`,
      { parse_mode: 'Markdown' }
    );

    ctx.session = {
      ...ctx.session,
      authenticated: false,
      awaitingEmail: true,
      awaitingOTP: false,
      pendingPhone: normalizedPhone,
      userId: undefined,
      phoneNumber: undefined,
      flow: undefined,
    };
    persistSessionState(chatId, ctx.session!);
    return;
  }

  ctx.session = {
    ...ctx.session,
    userId: user.id,
    phoneNumber: normalizedPhone,
    authenticated: false,
    awaitingEmail: false,
    flow: undefined,
  };
  persistSessionState(chatId, ctx.session!);

  const accountId = await ensureHederaAccountForUser(user.id);
  if (!accountId) {
    await ctx.reply(
      '⚠️ I could not automatically link a Hedera wallet. You can do this later from the Homebaise web app.'
    );
  }

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
    ...ctx.session,
    awaitingOTP: true,
    authenticated: false,
  };
  persistSessionState(chatId, ctx.session!);
});

// Handle text input (auth flows, NL commands, conversational flows)
bot.on('text', async (ctx: BotContext) => {
  if (!ctx.message || !('text' in ctx.message)) return;

  requireSession(ctx);

  const text = ctx.message.text.trim();
  const chatId = String(ctx.chat?.id);
  const isAuthed = !!ctx.session?.authenticated && !!ctx.session?.userId;

  if (ctx.session.awaitingEmail && ctx.session.pendingPhone) {
    const emailCandidate = text;

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

      ctx.session.userId = createdUser.id;
      ctx.session.phoneNumber = ctx.session.pendingPhone;
      ctx.session.authenticated = false;
      ctx.session.awaitingEmail = false;
      ctx.session.awaitingOTP = true;
      ctx.session.flow = undefined;
      persistSessionState(chatId, ctx.session);
    } catch (error) {
      console.error('Failed to create user from email flow:', error);
      await ctx.reply(
        `❌ I ran into an issue setting up your account. Please try again or contact support if it persists.`
      );
    }

    return;
  }

  if (ctx.session.awaitingOTP) {
    console.log(`🔐 OTP verification attempt: "${text}" for chat ${chatId}`);

    const result = await verifyOTP('telegram', chatId, text);
    console.log(`🔐 OTP verification result:`, result);

    if (result.success && result.userId) {
      await ensureHederaAccountForUser(result.userId);

      const session = await createBotSession(result.userId, 'telegram', chatId);

      if (session) {
        ctx.session.userId = result.userId;
        ctx.session.phoneNumber = result.phoneNumber;
        ctx.session.authenticated = true;
        ctx.session.awaitingOTP = false;
        ctx.session.awaitingEmail = false;
        ctx.session.flow = undefined;
        persistSessionState(chatId, ctx.session);

        await sendMainMenu(
          ctx,
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
      }
    } else {
      await ctx.reply(`❌ Invalid or expired OTP. Please try again with /start`);
    }
    return;
  }

  if (ctx.session.flow?.type === 'TRANSFER') {
    await handleTransferFlowInput(ctx, text);
    return;
  }

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

      const { createInvestmentByTitle } = await import('../shared/api');
      const result = await createInvestmentByTitle(titleQuery, amount, ctx.session?.userId);
      if (!result.success) {
        await ctx.reply(`❌ Investment failed: ${result.error || 'Unknown error'}`);
        return;
      }

      const txId = result.transactionId || '';
      const hashscanUrl = txId ? `https://hashscan.io/testnet/transaction/${txId}` : '';

      let confirmation =
        `✅ Investment submitted!\n\n` + `Title: ${titleQuery}\n` + `Amount: $${amount.toFixed(2)}`;
      if (hashscanUrl) confirmation += `\n\n🔗 Hashscan: ${hashscanUrl}`;
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
        `👋 I couldn't find an existing Homebaise account for *${normalizedPhone}*.\n\n` +
          `Please reply with your email address so I can create one for you.`,
        { parse_mode: 'Markdown' }
      );

      ctx.session.authenticated = false;
      ctx.session.awaitingEmail = true;
      ctx.session.awaitingOTP = false;
      ctx.session.pendingPhone = normalizedPhone;
      ctx.session.userId = undefined;
      ctx.session.phoneNumber = undefined;
      ctx.session.flow = undefined;
      persistSessionState(chatId, ctx.session);
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

    ctx.session.userId = user.id;
    ctx.session.phoneNumber = normalizedPhone;
    ctx.session.awaitingOTP = true;
    ctx.session.authenticated = false;
    ctx.session.awaitingEmail = false;
    ctx.session.flow = undefined;
    persistSessionState(chatId, ctx.session);
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

