const { Telegraf } = require('telegraf');

async function clearWebhook(token) {
  const bot = new Telegraf(token);
  console.log('Attempting to clear webhook for token:', token.substring(0, 10) + '...');
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    console.log('Webhook cleared successfully.');
  } catch (err) {
    console.error('Failed to clear webhook:', err);
  }
}

const token = process.argv[2];
if (!token) {
  console.error('No token provided.');
  process.exit(1);
}

clearWebhook(token);
