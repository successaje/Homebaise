# ✅ Bot Setup Checklist

Use this checklist to ensure your bot is fully configured and ready to run.

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install` in bot folder)
- [ ] Supabase database access
- [ ] Homebaise API running

## Configuration

- [ ] Telegram bot created via @BotFather
- [ ] Bot token copied
- [ ] `.env` file created from `.env.example`
- [ ] `TELEGRAM_BOT_TOKEN` set in `.env`
- [ ] `HOMEBASE_API_URL` set in `.env`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set in `.env`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set in `.env`

## Database

- [ ] Migration `20241220000007_create_bot_tables.sql` applied
- [ ] Tables created: `bot_sessions`, `user_notification_preferences`, `bot_notifications`, `bot_otp_codes`
- [ ] RLS policies enabled on bot tables
- [ ] Test user has `phone_number` in profiles table

## Testing

- [ ] Bot server starts without errors (`npm run dev`)
- [ ] Bot responds to `/start` command
- [ ] Phone number authentication works
- [ ] OTP verification works
- [ ] `/portfolio` command works
- [ ] `/balance` command works
- [ ] `/browse` command works

## Production Readiness

- [ ] OTP sent via SMS/Email (not in chat)
- [ ] Error handling improved
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Webhooks configured (optional)
- [ ] Rate limiting added
- [ ] Security audit completed

## Quick Test Commands

Once bot is running, test these in Telegram:

1. `/start` - Should prompt for phone number
2. Share phone number (via contact button)
3. Enter OTP code
4. `/portfolio` - View investments
5. `/balance` - Check wallet
6. `/browse` - See properties
7. `/help` - See all commands

## Troubleshooting

If bot doesn't start:
- Check `.env` file exists and has correct values
- Verify Telegram bot token is valid
- Check console for error messages
- Ensure database migration is applied

If authentication fails:
- Verify phone number format (+country code)
- Check user exists in profiles table with phone_number
- Verify OTP hasn't expired (10 minutes)

## Next Steps

After basic bot is working:
1. Integrate SMS service for OTP
2. Add notification system
3. Implement remaining features
4. Deploy to production
5. Add WhatsApp support

