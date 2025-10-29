// Main server entry point for Homebaise Bot
// Starts both Telegram and WhatsApp bots

import { startTelegramBot } from './telegram/bot';
// import { startWhatsAppBot } from './whatsapp/bot'; // Uncomment when WhatsApp is implemented

console.log('🚀 Homebaise Bot Server Starting...');

// Start Telegram bot
startTelegramBot();

// Start WhatsApp bot (when ready)
// startWhatsAppBot();

console.log('✅ Bot services initialized');

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down bot server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down bot server...');
  process.exit(0);
});

