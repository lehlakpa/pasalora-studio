const { randomUUID } = require('node:crypto');
const { Order } = require('../models/Order');
const { Store } = require('../models/Store');
const { Product } = require('../models/Product');
const { idFilter, orderJSON, productJSON } = require('../utils/serializers');
const esewa = require('../services/esewa');
const orderResponse = order => ({ orderId: order._id, ...(order.payment === 'eSewa' && order.paymentStatus !== 'Paid' ? { checkout: esewa.checkout(order) } : {}) });

const paymentOptions = (req, res) => res.json({ esewa: esewa.configured() });

const esewaReturn = async (req, res) => {
  try {
    if (typeof req.query.data !== 'string' || req.query.data.length > 8000) throw Error('Invalid response');
    const data = JSON.parse(Buffer.from(req.query.data, 'base64').toString('utf8'));
    const order = await Order.findById(data.transaction_uuid);
    if (!order || order.payment !== 'eSewa' || !await esewa.verify(data, order)) throw Error('Payment not verified');
    await Order.updateOne({ _id: order._id }, { $set: { paymentStatus: 'Paid', paymentReference: data.transaction_code } });
    res.redirect('/?payment=verified');
  } catch { res.redirect('/?payment=unverified'); }
};

const list = async (req, res) => { res.set('Cache-Control', 'no-store'); res.json({ orders: (await Order.collection.find().sort({ createdAt: -1 }).limit(200).toArray()).map(orderJSON) }); };

const update = async (req, res) => {
  const status = req.body?.status;
  if (!['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid order status.' });
  const order = await Order.collection.findOneAndUpdate(idFilter(req.params.id), { $set: { status, updatedAt: new Date() } }, { returnDocument: 'after' });
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.json({ order: orderJSON(order) });
};

const create = async (req, res) => {
  const { customer, items, requestId, payment } = req.body || {};
  if (!customer || typeof customer.name !== 'string' || customer.name.trim().length < 2 || customer.name.length > 80 || typeof customer.phone !== 'string' || !/^\+?[0-9 ()-]{7,20}$/.test(customer.phone) || typeof customer.address !== 'string' || customer.address.trim().length < 5 || customer.address.length > 500 || !Array.isArray(items) || !items.length || items.length > 50 || typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{16,64}$/.test(requestId) || !['COD', 'eSewa'].includes(payment)) return res.status(400).json({ error: 'Enter your name, phone, delivery address and choose a payment method.' });
  if (items.some(i => !i || typeof i.productId !== 'string' || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 100) || new Set(items.map(i => i.productId)).size !== items.length) return res.status(400).json({ error: 'Invalid order items.' });
  if (payment === 'eSewa' && !esewa.configured()) return res.status(503).json({ error: 'eSewa is currently unavailable. Please choose cash on delivery.' });
  const existing = await Order.findOne({ requestId });
  if (existing) return res.json(orderResponse(existing));
  const products = (await Product.collection.find({ $or: items.map(i => idFilter(i.productId)) }).toArray()).map(productJSON);
  const snapshots = [];
  for (const item of items) {
    const p = products.find(p => p.id === item.productId);
    if (!p || p.stock < item.quantity) return res.status(409).json({ error: 'A product is unavailable or its stock has changed. Refresh the store and try again.' });
    snapshots.push({ productId: p.id, name: p.name, price: p.price, image: p.image, quantity: item.quantity });
  }
  const settings = (await Store.findById('default').lean())?.document?.settings;
  if (!settings) return res.status(409).json({ error: 'The store is not ready to accept orders.' });
  const subtotal = snapshots.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const delivery = subtotal >= Number(settings.shipping || 0) ? 0 : Math.max(0, Number(settings.deliveryFee) || 0);
  try {
    const orderId = randomUUID();
    // Keep the existing legacy unique indexes compatible with new orders.
    const order = await Order.create({ _id: orderId, transactionUuid: orderId, requestKey: requestId, requestId, customer: { name: customer.name.trim(), phone: customer.phone.trim(), address: customer.address.trim() }, items: snapshots, subtotal, delivery, total: subtotal + delivery, currency: settings.currency || 'Rs', payment, paymentStatus: payment === 'eSewa' ? 'Pending' : 'Unpaid' });
    res.status(201).json(orderResponse(order));
  } catch (e) { if (e.code === 11000) { const duplicate = await Order.findOne({ requestId }); if (duplicate) return res.json(orderResponse(duplicate)); } throw e; }
};

module.exports = { paymentOptions, esewaReturn, list, update, create };
