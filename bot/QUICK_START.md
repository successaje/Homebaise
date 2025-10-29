# 🚀 Quick Start - Get Bot Running in 5 Minutes

## Step 1: Get Telegram Bot Token (2 minutes)

1. Open Telegram and search for **@BotFather**
2. Send message: `/newbot`
3. Choose a name: `Homebaise Bot`
4. Choose username: `your_homebaise_bot` (must end with `bot`)
5. **Copy the token** you receive (looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

## Step 2: Configure Bot (1 minute)

```bash
cd bot
cp .env.example .env
```

Edit `.env` and add:
```env
TELEGRAM_BOT_TOKEN=paste_your_token_here
HOMEBASE_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 3: Install & Run (2 minutes)

```bash
cd bot
npm install
npm run dev
```

You should see:
```
🚀 Homebaise Bot Server Starting...
✅ Bot services initialized
✅ Telegram bot started successfully
```

## Step 4: Test Bot

1. Open Telegram
2. Search for your bot (by the username you chose)
3. Click **Start** or send `/start`
4. Follow the authentication flow

## Common Issues

**"Token not configured"**
- Make sure `.env` file exists
- Check `TELEGRAM_BOT_TOKEN` has a value
- Restart bot after changing `.env`

**"Phone number not found"**
- User must have `phone_number` in profiles table
- Format: `+2348012345678` (with country code)

**"Database error"**
- Apply migration: `supabase/migrations/20241220000007_create_bot_tables.sql`
- Check Supabase credentials in `.env`

That's it! Your bot should be running. 🎉

