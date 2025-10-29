-- Create bot sessions table for tracking user-bot connections
CREATE TABLE IF NOT EXISTS bot_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('telegram', 'whatsapp')),
  chat_id TEXT NOT NULL,
  session_token TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(platform, chat_id)
);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_bot_sessions_user_id ON bot_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_chat_id ON bot_sessions(platform, chat_id);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_active ON bot_sessions(is_active) WHERE is_active = true;

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  telegram_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT true,
  investment_alerts BOOLEAN DEFAULT true,
  yield_alerts BOOLEAN DEFAULT true,
  property_alerts BOOLEAN DEFAULT true,
  market_alerts BOOLEAN DEFAULT false,
  milestone_alerts BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bot notifications log
CREATE TABLE IF NOT EXISTS bot_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('telegram', 'whatsapp')),
  chat_id TEXT NOT NULL,
  message_type TEXT NOT NULL, -- 'investment', 'yield', 'milestone', 'property', etc.
  title TEXT,
  message TEXT NOT NULL,
  metadata JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_bot_notifications_user_id ON bot_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_notifications_status ON bot_notifications(status);
CREATE INDEX IF NOT EXISTS idx_bot_notifications_sent_at ON bot_notifications(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_notifications_message_type ON bot_notifications(message_type);

-- Create OTP verification table for bot authentication
CREATE TABLE IF NOT EXISTS bot_otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  platform TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(platform, chat_id, otp_code)
);

-- Clean up expired OTPs (run periodically)
CREATE INDEX IF NOT EXISTS idx_bot_otp_expires ON bot_otp_codes(expires_at);

-- RLS Policies
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_otp_codes ENABLE ROW LEVEL SECURITY;

-- Bot sessions: users can only see their own sessions
CREATE POLICY "Users can view own bot sessions"
ON bot_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bot sessions"
ON bot_sessions FOR ALL
USING (auth.uid() = user_id);

-- Notification preferences: users manage their own
CREATE POLICY "Users can manage own notification preferences"
ON user_notification_preferences FOR ALL
USING (auth.uid() = user_id);

-- Notifications: users can view their own
CREATE POLICY "Users can view own notifications"
ON bot_notifications FOR SELECT
USING (auth.uid() = user_id);

-- OTP codes: service role only (handled by bot server)
CREATE POLICY "Service role can manage OTP codes"
ON bot_otp_codes FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- Function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM bot_otp_codes
  WHERE expires_at < NOW() OR verified = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create notification preferences
CREATE OR REPLACE FUNCTION get_or_create_notification_preferences(p_user_id UUID)
RETURNS user_notification_preferences AS $$
DECLARE
  v_prefs user_notification_preferences;
BEGIN
  SELECT * INTO v_prefs
  FROM user_notification_preferences
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_prefs;
  END IF;
  
  RETURN v_prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE bot_sessions IS 'Tracks active bot sessions linking users to their Telegram/WhatsApp chats';
COMMENT ON TABLE user_notification_preferences IS 'User preferences for bot notifications';
COMMENT ON TABLE bot_notifications IS 'Log of all bot notifications sent to users';
COMMENT ON TABLE bot_otp_codes IS 'Temporary OTP codes for bot authentication';

