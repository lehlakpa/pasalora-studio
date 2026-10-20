const mongoose = require('mongoose');
const { Store } = require('../models/Store');
const { Product } = require('../models/Product');
let databaseRetry;
async function connectDatabase() {
  if (!process.env.MONGO_URI || mongoose.connection.readyState !== 0) return;
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    const legacy = await Store.findById('default').lean();
    if (legacy && !legacy.catalogMigrated) {
      for (const p of legacy.document?.products || []) {
        await Product.updateOne({ _id: p.id }, { $setOnInsert: { name: p.name, category: p.category || 'Other', image: p.image || '', price: Math.max(0, Number(p.price) || 0), compareAt: Math.max(0, Number(p.compareAt) || 0), stock: Math.max(0, Math.floor(Number(p.stock) || 0)) } }, { upsert: true });
      }
      await Store.updateOne({ _id: 'default' }, { catalogMigrated: true });
    }
    console.log('Database connected');
  } catch {
    console.error('Database connection unavailable; retrying in 10 seconds. Check MONGO_URI and network access.');
    databaseRetry = setTimeout(connectDatabase, 10000);
    databaseRetry.unref();
  }
}
function stopDatabaseRetry() { clearTimeout(databaseRetry); }
module.exports = { connectDatabase, stopDatabaseRetry };
