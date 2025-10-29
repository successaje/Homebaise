import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Telegram
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
  },
  
  // WhatsApp (future)
  whatsapp: {
    apiKey: process.env.WHATSAPP_API_KEY || '',
  },
  
  // Homebaise API
  api: {
    url: process.env.HOMEBASE_API_URL || 'https://homebaise.vercel.app',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  
  // Server
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    env: process.env.NODE_ENV || 'development',
  },
  
  // OTP
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
    length: parseInt(process.env.OTP_LENGTH || '6', 10),
  },
};

// Validate required config
if (!config.telegram.token) {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN not set. Telegram bot will not work.');
}

if (!config.api.supabaseUrl || !config.api.supabaseKey) {
  throw new Error('❌ Supabase configuration is required');
}

