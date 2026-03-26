const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 3000,
  apiKey: process.env.API_KEY,
  webhookUrl: process.env.WEBHOOK_URL,
  logLevel: process.env.LOG_LEVEL || 'info',
};
