// Main server entry point for Homebaise Bot
// Starts both Telegram and WhatsApp bots

import * as dns from 'dns';
import * as http from 'http';
import { config } from './shared/config';

// Set DNS to prefer IPv4 for better connectivity
dns.setDefaultResultOrder('ipv4first');

import { startTelegramBot } from './telegram/bot';
// import { startWhatsAppBot } from './whatsapp/bot'; // Uncomment when WhatsApp is implemented

console.log('🚀 Homebaise Bot Server Starting...');

// Start Telegram bot
startTelegramBot();

// Start WhatsApp bot (when ready)
// startWhatsAppBot();

console.log('✅ Bot services initialized');

// Create HTTP server for Render health checks and to keep process alive
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'homebaise-bot',
      uptime: process.uptime()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(config.server.port, () => {
  console.log(`📡 Health check server listening on port ${config.server.port}`);
  console.log(`🔍 Health check: http://localhost:${config.server.port}/health`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n👋 Shutting down bot server...');
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

