import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { config } from './config';
import * as dns from 'dns';
import { createHederaAccount, getAccountBalance, getHbarUsdPrice, hasHederaOperatorCredentials } from './hedera';

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

export interface WalletSnapshot {
  hbarBalance: number;
  usdValue: number;
  recentActivity: Array<{
    type: string;
    amount: number;
    timestamp: string;
  }>;
  accountId?: string | null;
}

// Normalize phone number to standard format
export function normalizePhoneNumber(phone: string): string {
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

export interface BasicUserProfile {
  id: string;
  email?: string | null;
  full_name?: string | null;
  phone_number?: string | null;
  hedera_account_id?: string | null;
  hedera_private_key?: string | null;
  wallet_address?: string | null;
}

export async function getUserProfile(userId: string): Promise<BasicUserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone_number, hedera_account_id, hedera_private_key, wallet_address')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }

    return data as BasicUserProfile | null;
  } catch (error) {
    console.error('Unexpected error fetching user profile:', error);
    return null;
  }
}

export async function createUserWithPhoneAndEmail(
  phoneNumber: string,
  email: string,
  fullName?: string
): Promise<{ id: string; email?: string; full_name?: string; phone_number?: string }> {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const derivedName = fullName || email.split('@')[0]?.replace(/[\.\-_]/g, ' ');

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      phone: normalizedPhone,
      phone_confirm: true,
      password: randomUUID(),
      user_metadata: {
        full_name: derivedName,
        source: 'telegram_bot',
      },
    });

    if (error || !data?.user) {
      throw error ?? new Error('Failed to create Supabase user');
    }

    const profilePayload = {
      id: data.user.id,
      email,
      full_name: data.user.user_metadata?.full_name || derivedName,
      phone_number: normalizedPhone,
      provider: 'telegram',
      role: 'user',
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' });

    return {
      id: data.user.id,
      email: profilePayload.email,
      full_name: profilePayload.full_name,
      phone_number: profilePayload.phone_number,
    };
  } catch (error: any) {
    const message = error?.message || '';

    // Handle case where user already exists (by email or phone)
    if (message.includes('already registered')) {
      const existingByPhone = await getUserByPhone(normalizedPhone);
      if (existingByPhone) {
        // Ensure phone number is stored on profile
        await supabase
          .from('profiles')
          .update({ phone_number: normalizedPhone })
          .eq('id', existingByPhone.id);
        return existingByPhone;
      }

      const { data: profileByEmail } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone_number')
        .eq('email', email)
        .maybeSingle();

      if (profileByEmail) {
        if (!profileByEmail.phone_number) {
          await supabase
            .from('profiles')
            .update({ phone_number: normalizedPhone })
            .eq('id', profileByEmail.id);
        }

        return {
          id: profileByEmail.id,
          email: profileByEmail.email,
          full_name: profileByEmail.full_name ?? derivedName,
          phone_number: normalizePhoneNumber(profileByEmail.phone_number || normalizedPhone),
        };
      }
    }

    console.error('Failed to create user via bot:', error);
    throw error instanceof Error ? error : new Error('Failed to create user');
  }
}

function isHederaAccountId(value?: string | null): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return /^\d+\.\d+\.\d+$/.test(trimmed);
}

function sanitizeAccountId(value?: string | null): string | null {
  if (!isHederaAccountId(value)) return null;
  return value!.trim();
}

export async function ensureHederaAccountForUser(userId: string): Promise<string | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, wallet_address, hedera_account_id, hedera_private_key, hedera_public_key, hedera_evm_address')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch profile for Hedera check:', error);
      return null;
    }

    const existingAccountId =
      sanitizeAccountId(profile?.hedera_account_id) ??
      sanitizeAccountId(profile?.wallet_address);

    if (existingAccountId) {
      // Make sure profile reflects the account ID if it was only stored in wallet_address
      if (!isHederaAccountId(profile?.hedera_account_id)) {
        await supabase
          .from('profiles')
          .update({ hedera_account_id: existingAccountId, updated_at: new Date().toISOString() })
          .eq('id', userId);
      }
      return existingAccountId;
    }

    if (!hasHederaOperatorCredentials()) {
      console.warn('Hedera operator credentials missing; cannot auto-create Hedera account.');
      return null;
    }

    const account = await createHederaAccount();

    const updatePayload: Record<string, string | null> = {
      hedera_account_id: account.accountId,
      hedera_private_key: account.privateKey,
      hedera_public_key: account.publicKey,
      hedera_evm_address: account.evmAddress,
      updated_at: new Date().toISOString(),
    };

    if (!profile?.wallet_address || isHederaAccountId(profile.wallet_address)) {
      updatePayload.wallet_address = account.accountId;
    }

    await supabase
      .from('profiles')
      .upsert({ id: userId, ...updatePayload }, { onConflict: 'id' });

    return account.accountId;
  } catch (error) {
    console.error('Failed to create Hedera account for user:', error);
    return null;
  }
}

export async function getWalletSnapshot(userId: string): Promise<WalletSnapshot | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('hedera_account_id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load profile for wallet snapshot:', error);
    return null;
  }

  let accountId = profile?.hedera_account_id;

  if (!accountId) {
    accountId = await ensureHederaAccountForUser(userId);
  }

  if (!accountId) {
    return {
      hbarBalance: 0,
      usdValue: 0,
      recentActivity: [],
      accountId: null,
    };
  }

  const balance = await getAccountBalance(accountId);
  const hbarPrice = balance > 0 ? await getHbarUsdPrice() : 0;

  return {
    hbarBalance: balance,
    usdValue: balance * hbarPrice,
    recentActivity: [],
    accountId,
  };
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase.rpc('get_or_create_notification_preferences', {
    p_user_id: userId
  });

  if (error || !data) return null;
  return data as NotificationPreferences;
}

export async function updateNotificationPreferences(
  userId: string,
  updates: Partial<NotificationPreferences>
): Promise<NotificationPreferences | null> {
  const payload = {
    user_id: userId,
    ...updates,
    updated_at: new Date().toISOString(),
  } as Record<string, unknown>;

  const { data, error } = await supabase
    .from('user_notification_preferences')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Failed to update notification preferences:', error);
    return null;
  }

  return data as NotificationPreferences;
}

export async function getRecentBotNotifications(userId: string, limit = 5): Promise<Array<{
  title?: string | null;
  message?: string | null;
  message_type?: string | null;
  created_at?: string | null;
}>> {
  const { data, error } = await supabase
    .from('bot_notifications')
    .select('title, message, message_type, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to load recent bot notifications:', error);
    return [];
  }

  return data ?? [];
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

