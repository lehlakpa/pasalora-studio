const app = require('./app');
const mongoose = require('mongoose');
const { connectDatabase, stopDatabaseRetry } = require('./config/database');
const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST || '127.0.0.1';
const server = app.listen(port, host, () => console.log(`Studio API listening at http://${host}:${port}`));
async function shutdown() {
  stopDatabaseRetry();
  server.close(async () => { await mongoose.disconnect(); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
connectDatabase();
