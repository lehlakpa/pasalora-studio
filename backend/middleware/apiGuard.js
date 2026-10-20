const mongoose = require('mongoose');
module.exports = (req, res, next) => {
  if (req.path !== '/health' && mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Database is reconnecting. Please try again shortly.' });
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('X-Studio-Request') !== '1') return res.status(403).json({ error: 'Invalid request origin.' });
  next();
};
