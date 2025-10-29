# 🚀 Homebaise Bot Setup Guide

Complete guide to set up and run the Telegram/WhatsApp bot for Homebaise.

## 📋 Prerequisites

- Node.js 18 or higher
- Telegram account (for testing)
- Supabase database access
- Homebaise API running (localhost or production)

## 🔧 Step-by-Step Setup

### 1. Install Dependencies

```bash
cd bot
npm install
```

### 2. Create Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the prompts to create your bot:
   - Choose a name (e.g., "Homebaise Bot")
   - Choose a username (e.g., "homebaise_bot")
4. Copy the bot token you receive

### 3. Configure Environment

Create `.env` file in the `bot` folder:

```bash
cd bot
cp .env.example .env
```

Edit `.env` with your values:

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
HOMEBASE_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
PORT=3001
NODE_ENV=development
```

### 4. Run Database Migration

Apply the bot tables migration to your Supabase database:

```sql
-- Run the migration file:
-- supabase/migrations/20241220000007_create_bot_tables.sql
```

You can do this via:
- Supabase Dashboard SQL Editor, or
- Supabase CLI: `supabase migration up`

### 5. Ensure Phone Numbers in Profiles

Users need phone numbers in their profiles for bot authentication. Verify this:

```sql
SELECT id, email, phone_number FROM profiles LIMIT 5;
```

### 6. Start the Bot

```bash
npm run dev
```

You should see:
```
✅ Telegram bot started successfully
```

### 7. Test the Bot

1. Open Telegram
2. Search for your bot (by the username you chose)
3. Click "Start" or send `/start`
4. Follow the authentication flow

## 🧪 Testing the Bot

### Test Commands:

1. **Start/Authenticate:**
   ```
   /start
   ```

2. **View Portfolio:**
   ```
   /portfolio
   ```

3. **Check Balance:**
   ```
   /balance
   ```

4. **Browse Properties:**
   ```
   /browse
   ```

5. **Invest:**
   ```
   /invest [property_id] [amount]
   ```

## 🔐 Authentication Flow

1. User sends `/start`
2. Bot requests phone number
3. User shares phone number (via contact button)
4. Bot finds user in database by phone number
5. Bot generates OTP code
6. **Note:** Currently OTP is shown in chat for testing
   - In production, send via SMS/email
7. User enters OTP
8. Bot verifies and creates session
9. User is authenticated and can use all commands

## 📊 Database Tables Created

The migration creates:

- `bot_sessions` - Links users to their Telegram/WhatsApp chats
- `user_notification_preferences` - User notification settings
- `bot_notifications` - Log of all notifications sent
- `bot_otp_codes` - Temporary OTP codes for auth

## 🔔 Setting Up Notifications

To send notifications from your app to the bot:

```typescript
// Example: Send investment notification
await fetch('/api/bot/notify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-uuid',
    platform: 'telegram',
    messageType: 'investment',
    title: 'Investment Successful',
    message: 'Your investment of $100 was successful!',
    metadata: { propertyId: '...', amount: 100 }
  })
});
```

## 🐛 Troubleshooting

### Bot Not Responding

1. **Check if bot is running:**
   ```bash
   # Should see "Telegram bot started successfully"
   npm run dev
   ```

2. **Verify bot token:**
   - Token should start with numbers and colon: `123456789:ABC...`
   - Check `.env` file has correct token

3. **Check console for errors:**
   - Look for error messages in terminal
   - Common issues: invalid token, API connection errors

### Authentication Fails

1. **Phone number not found:**
   - User must have phone_number in profiles table
   - Format should include country code: `+2348012345678`

2. **OTP expired:**
   - OTPs expire after 10 minutes
   - Request new OTP by sending `/start` again

### API Errors

1. **Connection refused:**
   - Ensure Homebaise API is running (`npm run dev` in root)
   - Check `HOMEBASE_API_URL` in `.env`

2. **Supabase errors:**
   - Verify Supabase URL and service role key
   - Check database migrations are applied

## 🚀 Production Deployment

### For Production:

1. **Environment Variables:**
   - Use secure storage (Vercel, Railway, etc.)
   - Never commit `.env` to git

2. **OTP Delivery:**
   - Integrate SMS service (Twilio, AWS SNS)
   - Or send OTP via email
   - Remove OTP display in chat

3. **Webhooks (Recommended):**
   - Set up Telegram webhooks instead of polling
   - Better performance and reliability

4. **Monitoring:**
   - Add error tracking (Sentry)
   - Monitor bot logs
   - Track notification delivery rates

5. **Security:**
   - Use proper JWT for session tokens
   - Validate webhook secret tokens
   - Rate limit bot commands

## 📝 Next Steps

After basic setup works:

1. ✅ Test all commands
2. ✅ Set up notification system
3. ✅ Integrate SMS for OTP
4. ✅ Add more features (investing, trading)
5. ✅ Deploy to production
6. ✅ Add WhatsApp support

## 📞 Support

For issues or questions:
- Check console logs
- Review database tables
- Verify API endpoints
- Check Telegram Bot API status

Happy bot building! 🚀

