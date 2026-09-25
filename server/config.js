require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'plm-super-secret-jwt-key-2026-antigravity',
  JWT_EXPIRES_IN: '24h',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || ''
};
