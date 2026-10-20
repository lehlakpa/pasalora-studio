require('./config/environment');
const express = require('express');
const app = express();
app.disable('x-powered-by');
app.use(require('./middleware/origin'));
app.use(express.json({ limit: '2mb' }));
app.use('/api', require('./middleware/apiGuard'), require('./routes'));
app.use(require('./middleware/errorHandler'));
module.exports = app;
