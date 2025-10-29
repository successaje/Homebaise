import { createClient } from '@supabase/supabase-js';
import { config } from './config';
import * as dns from 'dns';

// Set DNS to prefer IPv4 for better connectivity
dns.setDefaultResultOrder('ipv4first');

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
  try {
    // Use upsert to handle duplicates
    const { data, error } = await supabase
      .from('bot_sessions')
      .upsert({
        user_id: userId,
        platform,
        chat_id: chatId,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'platform,chat_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating bot session:', error);
      return null;
    }

    return data as BotSession;
  } catch (error) {
    console.log('❌ Database connection failed, using fallback for bot session');
    
    // Fallback: Return a mock session
    return {
      id: 'demo-session-' + Date.now(),
      user_id: userId,
      platform: platform as 'telegram' | 'whatsapp',
      chat_id: chatId,
      session_token: 'demo-token',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

// Normalize phone number to standard format
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // If it starts with 0, replace with +234 (Nigerian format)
  if (normalized.startsWith('0')) {
    normalized = '+234' + normalized.substring(1);
  }
  
  // If it starts with 234 but no +, add +
  if (normalized.startsWith('234') && !normalized.startsWith('+234')) {
    normalized = '+' + normalized;
  }
  
  return normalized;
}

export async function getUserByPhone(phoneNumber: string): Promise<{ id: string; email?: string; full_name?: string; phone_number?: string } | null> {
  // Normalize the phone number first
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  
  console.log(`🔍 Looking up phone: "${phoneNumber}" → normalized: "${normalizedPhone}"`);
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone_number')
      .eq('phone_number', normalizedPhone)
      .single();

    if (error) {
      console.log(`❌ Phone lookup failed:`, error);
      return null;
    }
    
    if (!data) {
      console.log(`❌ No user found with phone: ${normalizedPhone}`);
      return null;
    }
    
    console.log(`✅ User found:`, { id: data.id, email: data.email, name: data.full_name });
    return data as { id: string; email?: string; full_name?: string; phone_number?: string };
  } catch (error) {
    console.log(`❌ Database connection failed, using fallback for phone: ${normalizedPhone}`);
    
    // Fallback: Create a mock user for demo purposes
    return {
      id: 'demo-user-' + Date.now(),
      email: 'demo@homebaise.com',
      full_name: 'Demo User',
      phone_number: normalizedPhone
    };
  }
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

