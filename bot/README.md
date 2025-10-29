# Homebaise Messaging Bot

Telegram and WhatsApp bot for the Homebaise platform, allowing users to manage their investments, check balances, browse properties, and receive notifications through messaging apps.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Telegram Bot Token (from @BotFather)
- Supabase credentials
- Homebaise API URL

### Installation

1. **Install dependencies:**
```bash
cd bot
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Set up Telegram Bot:**
   - Message @BotFather on Telegram
   - Use `/newbot` command
   - Follow instructions to create bot
   - Copy the bot token to `.env`

4. **Run database migrations:**
   Apply the migration in `supabase/migrations/20241220000007_create_bot_tables.sql`

5. **Start the bot:**
```bash
npm run dev
```

## 📁 Project Structure

```
bot/
├── src/
│   ├── telegram/          # Telegram bot implementation
│   │   ├── bot.ts         # Main bot setup
│   │   └── handlers/      # Command handlers
│   ├── whatsapp/          # WhatsApp bot (future)
│   └── shared/            # Shared utilities
│       ├── config.ts      # Configuration
│       ├── database.ts    # Database functions
│       ├── api.ts         # API client
│       └── auth.ts        # Authentication
├── config/                # Configuration files
├── package.json
└── tsconfig.json
```

## 🤖 Available Commands

### Authentication
- `/start` - Start bot and authenticate

### Portfolio Management
- `/portfolio` - View investment portfolio
- `/balance` - Check HBAR wallet balance

### Properties
- `/browse` - Browse available properties
- `/invest [property_id] [amount]` - Invest in a property

### Help
- `/help` - Show all commands

## 🔧 Configuration

### Environment Variables

```env
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Homebaise API
HOMEBASE_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Server
PORT=3001
NODE_ENV=development
```

## 🔐 Authentication Flow

1. User sends `/start` command
2. Bot requests phone number
3. User provides phone number (via contact button or text)
4. Bot sends OTP to user's phone
5. User enters OTP in bot
6. Bot verifies and links account
7. User can now access all features

## 📊 Database Schema

The bot uses several tables:

- `bot_sessions` - Active bot sessions
- `user_notification_preferences` - Notification settings
- `bot_notifications` - Notification log
- `bot_otp_codes` - OTP verification codes

See migration file for full schema.

## 🔔 Notifications

The bot can send notifications for:

- Investment confirmations
- Yield distributions
- Property milestones (50% funded, 100% funded, etc.)
- Market updates
- New properties

Notifications are logged in `bot_notifications` table and respect user preferences.

## 🛠️ Development

### Running in Development

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Testing

Manual testing with Telegram:
1. Start bot in development mode
2. Open Telegram and find your bot
3. Send `/start` to begin

## 📱 API Integration

The bot communicates with Homebaise API endpoints:

- `GET /api/portfolio` - Get user portfolio
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/properties` - Get available properties
- `POST /api/investments` - Create investment

## 🔮 Future Features

- [ ] WhatsApp integration
- [ ] Voice message support
- [ ] Natural language queries
- [ ] Automated trading strategies
- [ ] Investment alerts
- [ ] Social sharing
- [ ] Multi-language support

## 📝 Notes

- The bot uses long polling (default for Telegraf)
- For production, consider using webhooks for better performance
- OTP codes expire after 10 minutes
- Sessions remain active until user disconnects

## 🆘 Troubleshooting

**Bot not responding:**
- Check if bot token is correct
- Verify bot is running (`npm run dev`)
- Check console for errors

**Authentication fails:**
- Verify phone number format (+country code)
- Check if OTP expired (10 min)
- Verify phone number exists in profiles table

**API errors:**
- Check Homebaise API is running
- Verify API URL in .env
- Check Supabase credentials

## 📄 License

MIT

