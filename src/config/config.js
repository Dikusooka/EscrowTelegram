require('dotenv').config();

const config = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  ADMIN_ID: process.env.ADMIN_ID,
  DATABASE_URL: process.env.DATABASE_URL,
  BTCPAY_URL: process.env.BTCPAY_URL,
  BTCPAY_API_KEY: process.env.BTCPAY_API_KEY,
  BTCPAY_STORE_ID: process.env.BTCPAY_STORE_ID
};

module.exports = config;
