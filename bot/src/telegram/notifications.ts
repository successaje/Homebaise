import { EventEmitter } from 'events';
import { Telegraf } from 'telegraf';
import { BotContext } from './bot';
import { buildNotificationKeyboard, NotificationAction } from './ui';

export interface NotificationPayload {
  title: string;
  message: string;
  userId?: string;
  chatId?: string;
  actions?: NotificationAction[];
}

export const notificationEmitter = new EventEmitter();

export function registerNotificationBridge(
  bot: Telegraf<BotContext>,
  findChatIdsForUser: (userId: string) => string[]
) {
  notificationEmitter.on('notify', async (payload: NotificationPayload) => {
    try {
      const chatIds = new Set<string>();

      if (payload.chatId) {
        chatIds.add(String(payload.chatId));
      }

      if (payload.userId) {
        for (const chatId of findChatIdsForUser(payload.userId)) {
          chatIds.add(chatId);
        }
      }

      if (!chatIds.size) {
        console.warn('Notification emitted but no active chat found for payload:', payload);
        return;
      }

      const keyboard = payload.actions ? buildNotificationKeyboard(payload.actions) : undefined;
      const message = `*${payload.title}*\n\n${payload.message}`;

      for (const chatId of chatIds) {
        await bot.telegram.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
      }
    } catch (error) {
      console.error('Failed to deliver notification:', error);
    }
  });
}

export function emitPropertyYieldNotification(params: {
  userId: string;
  propertyTitle: string;
  percentage: number;
  propertyId?: string;
  chatId?: string;
}) {
  notificationEmitter.emit('notify', {
    userId: params.userId,
    chatId: params.chatId,
    title: '🏗️ Property Yield Update',
    message: `Your property *${params.propertyTitle}* just yielded +${params.percentage.toFixed(2)}%.`,
    actions: [
      params.propertyId
        ? { text: 'View Details', callbackData: `VIEW_PROPERTY_${params.propertyId}` }
        : { text: 'View Details', callbackData: 'MENU_VIEW_PROPERTIES' },
      { text: 'Withdraw Yield', callbackData: 'MENU_TRANSFER_FUNDS' },
    ],
  } as NotificationPayload);
}

