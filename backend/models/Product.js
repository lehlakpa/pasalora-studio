const mongoose = require('mongoose');
const Product = mongoose.model('Product', new mongoose.Schema({
  _id: String, name: { type: String, required: true }, category: { type: String, required: true },
  description: { type: String, default: '' }, image: String, price: { type: Number, min: 0, required: true }, compareAt: { type: Number, min: 0, default: 0 },
  imageSettings: { fit: { type: String, enum: ['cover', 'contain'], default: 'cover' }, x: { type: Number, min: 0, max: 100, default: 50 }, y: { type: Number, min: 0, max: 100, default: 50 } },
  stock: { type: Number, min: 0, default: 0 }
}, { timestamps: true }));
module.exports = { Product };
