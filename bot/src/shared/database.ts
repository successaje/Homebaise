import { createClient } from '@supabase/supabase-js';
import { config } from './config';

export const supabase = createClient(
  config.api.supabaseUrl,
  config.api.supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Bot session types
export interface BotSession {
  id: string;
  user_id: string;
  platform: 'telegram' | 'whatsapp';
  chat_id: string;
  session_token?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  telegram_enabled: boolean;
  whatsapp_enabled: boolean;
  investment_alerts: boolean;
  yield_alerts: boolean;
  property_alerts: boolean;
  market_alerts: boolean;
  milestone_alerts: boolean;
}

// Database helper functions
export async function getBotSession(platform: string, chatId: string): Promise<BotSession | null> {
  const { data, error } = await supabase
    .from('bot_sessions')
    .select('*')
    .eq('platform', platform)
    .eq('chat_id', chatId)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data as BotSession;
}

export async function createBotSession(
  userId: string,
  platform: string,
  chatId: string
): Promise<BotSession | null> {
  const { data, error } = await supabase
    .from('bot_sessions')
    .insert({
      user_id: userId,
      platform,
      chat_id: chatId,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating bot session:', error);
    return null;
  }

  return data as BotSession;
}

export async function getUserByPhone(phoneNumber: string): Promise<{ id: string; email?: string; full_name?: string } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('phone_number', phoneNumber)
    .single();

  if (error || !data) return null;
  return data as { id: string; email?: string; full_name?: string };
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase.rpc('get_or_create_notification_preferences', {
    p_user_id: userId
  });

  if (error || !data) return null;
  return data as NotificationPreferences;
}

export async function logNotification(
  userId: string,
  platform: string,
  chatId: string,
  messageType: string,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await supabase
    .from('bot_notifications')
    .insert({
      user_id: userId,
      platform,
      chat_id: chatId,
      message_type: messageType,
      title,
      message,
      metadata: metadata || {},
      status: 'sent'
    });
}

