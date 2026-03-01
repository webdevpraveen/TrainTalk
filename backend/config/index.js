require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

module.exports = {
  PORT: process.env.PORT || 3000,
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY || '17c223760bmsha2a408f4071fbdep11675ajsn4d376a39efb9',
  RAPIDAPI_HOST: process.env.RAPIDAPI_HOST || 'irctc1.p.rapidapi.com',
  SESSION_SECRET: process.env.SESSION_SECRET || 'traintalk-secret-key',
  SESSION_TTL: 2 * 60 * 60 * 1000, // 2 hours
  ROOM_CLEANUP_INTERVAL: 10 * 60 * 1000, // check every 10 minutes
  ROOM_EXPIRY_AFTER_JOURNEY: 30 * 60 * 1000, // 30 minutes after journey end
  MAX_MESSAGE_LENGTH: 500,
  MESSAGE_RATE_LIMIT_MS: 1000, // 1 message per second
};
