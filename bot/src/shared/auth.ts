import { supabase, getUserByPhone } from './database';
import { config } from './config';
import crypto from 'crypto';
import * as dns from 'dns';

// Set DNS to prefer IPv4 for better connectivity
dns.setDefaultResultOrder('ipv4first');

// Generate random OTP
export function generateOTP(): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < config.otp.length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

// Create OTP code
export async function createOTP(phoneNumber: string, platform: string, chatId: string): Promise<string> {
  const otp = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + config.otp.expiryMinutes);

  // Delete any existing OTPs for this chat
  await supabase
    .from('bot_otp_codes')
    .delete()
    .eq('platform', platform)
    .eq('chat_id', chatId);

  // Insert new OTP
  await supabase
    .from('bot_otp_codes')
    .insert({
      phone_number: phoneNumber,
      platform,
      chat_id: chatId,
      otp_code: otp,
      expires_at: expiresAt.toISOString(),
    });

  return otp;
}

// Verify OTP
export async function verifyOTP(
  platform: string,
  chatId: string,
  otpCode: string
): Promise<{ success: boolean; userId?: string; phoneNumber?: string }> {
  console.log(`🔍 Verifying OTP: platform=${platform}, chatId=${chatId}, otpCode=${otpCode}`);
  
  const { data, error } = await supabase
    .from('bot_otp_codes')
    .select('*')
    .eq('platform', platform)
    .eq('chat_id', chatId)
    .eq('otp_code', otpCode)
    .eq('verified', false)
    .single();

  console.log(`🔍 OTP query result:`, { data, error });

  if (error || !data) {
    console.log(`❌ OTP not found or error:`, error);
    return { success: false };
  }

  // Check if expired
  if (new Date(data.expires_at) < new Date()) {
    return { success: false };
  }

  // Mark as verified
  await supabase
    .from('bot_otp_codes')
    .update({ verified: true })
    .eq('id', data.id);

  // Find user by phone number
  const user = await getUserByPhone(data.phone_number);
  if (!user) {
    return { success: false };
  }

  return {
    success: true,
    userId: user.id,
    phoneNumber: data.phone_number,
  };
}

// Create session token
export function createSessionToken(userId: string): string {
  const payload = {
    userId,
    timestamp: Date.now(),
  };
  const token = Buffer.from(JSON.stringify(payload)).toString('base64');
  return token;
}

