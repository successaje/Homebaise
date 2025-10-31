# Deployment Guide - Homebaise Bot to Render

This guide walks you through deploying the Homebaise Telegram bot to Render.

## 🚀 Prerequisites

Before deploying, ensure you have:

- ✅ GitHub repository with bot code
- ✅ Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- ✅ Deployed Homebaise API (Vercel or other hosting)
- ✅ Supabase project with database migrations applied
- ✅ Render account (free tier available)

---

## 📋 Step-by-Step Deployment

### 1. Prepare Your Repository

Make sure your code is pushed to GitHub:

```bash
git add -A
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Authorize Render to access your repositories

### 3. Create New Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Select your GitHub repository
3. Configure the service:
   - **Name**: `homebaise-bot` (or your preferred name)
   - **Root Directory**: `bot` (important!)
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`

### 4. Configure Build & Start Commands

Render will auto-detect these from `render.yaml`, but verify:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 5. Set Environment Variables

Click "Advanced" → "Add Environment Variable" and add:

```env
# Required
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_from_botfather
HOMEBASE_API_URL=https://your-homebaise-app.vercel.app
BOT_SERVER_TOKEN=your_secure_random_token_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional but recommended
PORT=10000
NODE_ENV=production
BOT_SKIP_DB=false
```

**Generate BOT_SERVER_TOKEN:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Install dependencies
   - Build TypeScript
   - Start the bot server
3. Monitor deployment logs

### 7. Verify Deployment

Once deployed, check:

1. **Render Dashboard**: Service shows "Live" status
2. **Health Check**: Visit `https://your-bot.onrender.com/health`
   - Should return: `{"status":"ok","service":"homebaise-bot",...}`
3. **Telegram**: Send `/start` to your bot
4. **Logs**: Check Render logs for bot startup messages

---

## 🔧 Post-Deployment Configuration

### Update HOMEBASE_API_URL

Make sure your main Homebaise app (Vercel) has `BOT_SERVER_TOKEN` matching the bot's token:

```env
# In your main app's .env.production
BOT_SERVER_TOKEN=your_secure_random_token_here
```

This allows the bot to authenticate with your API.

### Test Bot Commands

Try these commands in Telegram:

```
/start      - Authenticate and link account
/help       - Show all commands
/portfolio  - View investments
/balance    - Check HBAR balance
/browse     - List available properties
/invest     - Make an investment
```

---

## 🐛 Troubleshooting

### Bot Not Responding

1. **Check Render logs**: Look for startup errors
2. **Verify Telegram token**: Token must be valid from @BotFather
3. **Check health endpoint**: `curl https://your-bot.onrender.com/health`

### Authentication Fails

1. **Verify Supabase credentials**: Check environment variables
2. **Check database**: Ensure `bot_sessions` table exists
3. **Review logs**: Look for OTP generation errors

### API Connection Errors

1. **Check HOMEBASE_API_URL**: Must be publicly accessible
2. **Verify BOT_SERVER_TOKEN**: Must match in both services
3. **Test API endpoint**: `curl -H "x-bot-token: YOUR_TOKEN" https://your-api/bot/invest`

### Build Errors

1. **Check Node version**: Render uses Node 18+
2. **Review TypeScript errors**: Look in build logs
3. **Verify tsconfig.json**: Ensure proper configuration

---

## 🔄 Updating the Bot

### Manual Update

1. Push changes to GitHub
2. Render auto-detects and redeploys
3. Monitor deployment in Render dashboard

### Rollback

1. Go to Render dashboard
2. Click "Manual Deploy"
3. Select previous commit
4. Deploy

---

## 💰 Render Pricing

- **Free Tier**: 750 hours/month, auto-sleeps after 15 min inactivity
- **Starter Plan**: $7/month - No auto-sleep, always-on
- **Professional**: $25/month - More resources

**For Production**: Upgrade to Starter or Professional to prevent auto-sleep.

---

## 📊 Monitoring

### Check Bot Health

```bash
curl https://your-bot.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "homebaise-bot",
  "uptime": 3600.5
}
```

### View Logs

- **Render Dashboard**: Go to your service → "Logs"
- **Stream logs in real-time**
- **Filter by keyword**

### Set Up Alerts

1. Go to Render Dashboard → "Alerts"
2. Add webhook for downtime notifications
3. Configure email alerts

---

## 🚀 Next Steps

After deployment:

1. ✅ Test all bot commands
2. ✅ Share bot link: `https://t.me/homebaise_bot`
3. ✅ Monitor for 24 hours
4. ✅ Set up production monitoring
5. ✅ Consider upgrading Render plan if needed

---

## 📞 Support

If you encounter issues:

1. Check [Render Docs](https://render.com/docs)
2. Review bot [README.md](README.md)
3. Check [GitHub Issues](https://github.com/your-repo/issues)

---

**Happy deploying! 🎉**

