// Main server entry point for Homebaise Bot
// Starts both Telegram and WhatsApp bots

import * as dns from 'dns';
import * as http from 'http';
import { config } from './shared/config';

// Set DNS to prefer IPv4 for better connectivity
dns.setDefaultResultOrder('ipv4first');

import { startTelegramBot } from './telegram/bot';
import { notificationEmitter } from './telegram/notifications';
// import { startWhatsAppBot } from './whatsapp/bot'; // Uncomment when WhatsApp is implemented

console.log('🚀 Homebaise Bot Server Starting...');

// Start Telegram bot
startTelegramBot();

// Start WhatsApp bot (when ready)
// startWhatsAppBot();

console.log('✅ Bot services initialized');

// Create HTTP server for Render health checks and to keep process alive
const server = http.createServer((req, res) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          service: 'homebaise-bot',
          uptime: process.uptime(),
        })
      );
      return;
    }
  }

  if (req.method === 'POST' && req.url === '/notify') {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const token = req.headers['x-bot-token'];
        if (!token || token !== config.bot.serverToken) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        const payload = JSON.parse(body || '{}');
        notificationEmitter.emit('notify', payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('Failed to process /notify payload:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid payload' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
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

