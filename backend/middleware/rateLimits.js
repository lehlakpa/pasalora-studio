const { rateLimit } = require('express-rate-limit');
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many attempts. Try again in 15 minutes.' } });
const orderLimit = rateLimit({ windowMs: 60000, limit: 10, message: { error: 'Please wait before placing another order.' } });
module.exports = { authLimit, orderLimit };
