require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  apiKey: process.env.API_KEY,
  webhookUrl: process.env.WEBHOOK_URL,
  logLevel: process.env.LOG_LEVEL || 'info',
};
