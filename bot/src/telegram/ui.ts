import { InlineKeyboardButton, InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';

export const ACTIONS = {
  VIEW_PROPERTIES: 'MENU_VIEW_PROPERTIES',
  CHECK_BALANCE: 'MENU_CHECK_BALANCE',
  TRANSFER_FUNDS: 'MENU_TRANSFER_FUNDS',
  VIEW_TOKENS: 'MENU_VIEW_TOKENS',
  VIEW_ACCOUNT: 'MENU_VIEW_ACCOUNT',
  SHOW_MENU: 'MENU_SHOW_HOME',
  FLOW_TRANSFER_CONFIRM: 'FLOW_TRANSFER_CONFIRM',
  FLOW_TRANSFER_CANCEL: 'FLOW_TRANSFER_CANCEL',
  VIEW_PROPERTY_PREFIX: 'VIEW_PROPERTY_',
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
      return { text: action.text, callback_data: action.callbackData };
    }

    return {
      text: action.text,
      callback_data: ACTIONS.SHOW_MENU,
    };
  });

  return {
    inline_keyboard: chunkArray(buttons, 2),
  };
}

