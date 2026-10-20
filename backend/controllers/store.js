const mongoose = require('mongoose');
const { Store } = require('../models/Store');
const { Product } = require('../models/Product');
const { productJSON } = require('../utils/serializers');
const get = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Database is not connected' });
  const stored = await Store.findById('default').lean();
  const products = (await Product.collection.find().sort({ createdAt: 1 }).toArray()).map(productJSON);
  res.json({ products, document: stored?.document ? { ...stored.document, products } : null, updatedAt: stored?.updatedAt });
};
const save = async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'Database is not connected' });
  const d = req.body;
  if (!d || !Array.isArray(d.sections) || !Array.isArray(d.products) || !d.settings || typeof d.settings.storeName !== 'string' || d.sections.length > 100 || d.products.length > 500) return res.status(400).json({ error: 'Invalid store document' });
  // The catalog has its own API; stale editor drafts must never overwrite it.
  await Store.findByIdAndUpdate('default', { document: { ...d, products: [] }, catalogMigrated: true }, { upsert: true });
  res.json({ saved: true });
};
module.exports = { get, save };
