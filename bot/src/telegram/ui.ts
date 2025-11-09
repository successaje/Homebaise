import { InlineKeyboardButton, InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';
import { NotificationPreferences } from '../shared/database';

export const ACTIONS = {
  VIEW_PROPERTIES: 'MENU_VIEW_PROPERTIES',
  CHECK_BALANCE: 'MENU_CHECK_BALANCE',
  TRANSFER_FUNDS: 'MENU_TRANSFER_FUNDS',
  VIEW_TOKENS: 'MENU_VIEW_TOKENS',
  VIEW_ACCOUNT: 'MENU_VIEW_ACCOUNT',
  VIEW_ACTIVITY: 'MENU_VIEW_ACTIVITY',
  MANAGE_ALERTS: 'MENU_MANAGE_ALERTS',
  GET_SUPPORT: 'MENU_GET_SUPPORT',
  SHOW_MENU: 'MENU_SHOW_HOME',
  FLOW_TRANSFER_CONFIRM: 'FLOW_TRANSFER_CONFIRM',
  FLOW_TRANSFER_CANCEL: 'FLOW_TRANSFER_CANCEL',
  VIEW_PROPERTY_PREFIX: 'VIEW_PROPERTY_',
  INVEST_PROPERTY_PREFIX: 'INVEST_PROPERTY_',
  INVEST_QUICK_PREFIX: 'INVEST_QUICK_',
  INVEST_CUSTOM: 'INVEST_CUSTOM',
  ALERT_TOGGLE_PREFIX: 'ALERT_TOGGLE_',
  ONBOARD_EXISTING: 'ONBOARD_EXISTING',
  ONBOARD_NEW: 'ONBOARD_NEW',
} as const;

export type ActionKey = typeof ACTIONS[keyof typeof ACTIONS];

export interface NotificationAction {
  text: string;
  url?: string;
  callbackData?: string;
}

function chunkArray<T>(buttons: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < buttons.length; i += size) {
    rows.push(buttons.slice(i, i + size));
  }
  return rows;
}

export function buildMainMenuKeyboard(): InlineKeyboardMarkup {
  const buttons: InlineKeyboardButton.CallbackButton[] = [
    { text: '🏠 View Properties', callback_data: ACTIONS.VIEW_PROPERTIES },
    { text: '💰 Check Balance', callback_data: ACTIONS.CHECK_BALANCE },
    { text: '🔁 Transfer Funds', callback_data: ACTIONS.TRANSFER_FUNDS },
    { text: '🎟️ View Tokens', callback_data: ACTIONS.VIEW_TOKENS },
    { text: '🪪 Account Details', callback_data: ACTIONS.VIEW_ACCOUNT },
    { text: '📰 Recent Activity', callback_data: ACTIONS.VIEW_ACTIVITY },
    { text: '🔔 Notification Settings', callback_data: ACTIONS.MANAGE_ALERTS },
    { text: '🆘 Get Support', callback_data: ACTIONS.GET_SUPPORT },
  ];

  return {
    inline_keyboard: chunkArray(buttons, 2),
  };
}

export function buildBackToMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: '⬅️ Back to Menu', callback_data: ACTIONS.SHOW_MENU }],
    ],
  };
}

export function buildTransferConfirmKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '✅ Confirm', callback_data: ACTIONS.FLOW_TRANSFER_CONFIRM },
        { text: '❌ Cancel', callback_data: ACTIONS.FLOW_TRANSFER_CANCEL },
      ],
      [{ text: '⬅️ Back to Menu', callback_data: ACTIONS.SHOW_MENU }],
    ],
  };
}

export function buildNotificationKeyboard(actions: NotificationAction[]): InlineKeyboardMarkup | undefined {
  if (!actions.length) return undefined;

  const buttons = actions.map<InlineKeyboardButton>((action) => {
    if (action.url) {
      return { text: action.text, url: action.url };
    }

    if (action.callbackData) {
      return { text: action.text, callback_data: action.callbackData } as InlineKeyboardButton.CallbackButton;
    }

    return {
      text: action.text,
      callback_data: ACTIONS.SHOW_MENU,
    } as InlineKeyboardButton.CallbackButton;
  });

  return {
    inline_keyboard: chunkArray(buttons, 2),
  };
}

export function buildOnboardingChoiceKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '🔑 I already have an account', callback_data: ACTIONS.ONBOARD_EXISTING },
      ],
      [
        { text: '✨ Create a new account', callback_data: ACTIONS.ONBOARD_NEW },
      ],
    ],
  };
}

export function buildInvestAmountKeyboard(propertyId: string, propertyName: string): InlineKeyboardMarkup {
  const quickAmounts = [10, 25, 50];
  const rows = quickAmounts.map((amount) => [
    {
      text: `$${amount}`,
      callback_data: `${ACTIONS.INVEST_QUICK_PREFIX}${propertyId}:${amount}`,
    },
  ]);

  rows.push([
    { text: '✏️ Enter custom amount', callback_data: `${ACTIONS.INVEST_CUSTOM}:${propertyId}` },
  ]);
  rows.push([{ text: '⬅️ Back to Menu', callback_data: ACTIONS.SHOW_MENU }]);

  return {
    inline_keyboard: rows,
  };
}

export function buildAlertPreferencesKeyboard(prefs: NotificationPreferences): InlineKeyboardMarkup {
  const items: Array<{ key: keyof NotificationPreferences; label: string; value: boolean }> = [
    { key: 'investment_alerts', label: 'Investments', value: prefs.investment_alerts },
    { key: 'yield_alerts', label: 'Yields', value: prefs.yield_alerts },
    { key: 'property_alerts', label: 'Property Milestones', value: prefs.property_alerts },
    { key: 'market_alerts', label: 'Market Updates', value: prefs.market_alerts },
    { key: 'milestone_alerts', label: 'Funding Milestones', value: prefs.milestone_alerts },
  ];

  const rows = items.map((item) => {
    const status = item.value ? '✅ On' : '❌ Off';
    return [
      {
        text: `${status} · ${item.label}`,
        callback_data: `${ACTIONS.ALERT_TOGGLE_PREFIX}${item.key}`,
      },
    ];
  });

  rows.push([{ text: '⬅️ Back to Menu', callback_data: ACTIONS.SHOW_MENU }]);

  return {
    inline_keyboard: rows,
  };
}

