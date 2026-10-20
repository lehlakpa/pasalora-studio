const { randomUUID } = require('node:crypto');
const { Product } = require('../models/Product');
const { idFilter, productJSON } = require('../utils/serializers');
const { fields } = require('../utils/productFields');

const list = async (req, res) => { res.set('Cache-Control', 'no-store'); res.json({ products: (await Product.collection.find().sort({ createdAt: 1 }).toArray()).map(productJSON) }); };

const get = async (req, res) => {
  const product = await Product.collection.findOne(idFilter(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found. It may have been deleted.' });
  res.set('Cache-Control', 'no-store');
  res.json({ product: productJSON(product) });
};

const create = async (req, res) => {
  const data = fields(req.body);
  if (!data) return res.status(400).json({ error: 'Enter a product name, category, valid price, stock and HTTPS image URL.' });
  res.status(201).json({ product: productJSON(await Product.create({ _id: randomUUID(), ...data })) });
};

const update = async (req, res) => {
  const data = fields(req.body);
  if (!data) return res.status(400).json({ error: 'Invalid product details.' });
  const product = await Product.collection.findOneAndUpdate(idFilter(req.params.id), { $set: { ...data, updatedAt: new Date() } }, { returnDocument: 'after' });
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product: productJSON(product) });
};

const remove = async (req, res) => {
  const deleted = await Product.collection.findOneAndDelete(idFilter(req.params.id));
  if (!deleted) return res.status(404).json({ error: 'Product not found.' });
  res.json({ deleted: true });
};

module.exports = { list, get, create, update, remove };
