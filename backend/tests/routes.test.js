const test = require('node:test');
const assert = require('node:assert/strict');
process.env.ACCESS_TOKEN_SECRET = 'access-test-secret'.repeat(3);
process.env.REFRESH_TOKEN_SECRET = 'refresh-test-secret'.repeat(3);
const app = require('../app');
const mongoose = require('mongoose');
const { Product } = require('../models/Product');
const { Store } = require('../models/Store');
const { User } = require('../models/User');
test('reorganized API routes retain controllers and middleware', async () => {
  const previous = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
  const originals = { find: Product.collection.find, findOne: Product.collection.findOne, store: Store.findById, user: User.exists };
  let server;
  try {
    Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, value: 1 });
    const product = { _id: 'test-product', name: 'Test product', category: 'Other', price: 100, stock: 3, description: 'Test details' };
    Product.collection.find = () => ({ sort: () => ({ toArray: async () => [product] }) });
    Product.collection.findOne = async ({ _id }) => _id === product._id ? product : null;
    Store.findById = () => ({ lean: async () => ({ document: { sections: [], settings: { storeName: 'Test store' } } }) });
    User.exists = async () => null;
    await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
    const base = `http://127.0.0.1:${server.address().port}`;
    const request = (url, options) => fetch(base + url, options);
    assert.equal((await request('/api/health')).status, 200);
    assert.equal((await (await request('/api/products')).json()).products[0].name, 'Test product');
    assert.equal((await (await request('/api/products/test-product')).json()).product.description, 'Test details');
    assert.equal((await request('/api/products/missing')).status, 404);
    assert.equal((await (await request('/api/store')).json()).document.products[0].id, 'test-product');
    assert.equal((await (await request('/api/auth/status')).json()).registrationOpen, true);
    assert.equal((await request('/api/orders/payment-options')).status, 200);
    assert.equal((await request('/api/orders')).status, 401);
    assert.equal((await request('/api/uploads', { method: 'POST', headers: { 'X-Studio-Request': '1' } })).status, 401);
    assert.equal((await request('/api/products', { method: 'POST' })).status, 403);
    assert.equal((await request('/api/health', { headers: { Origin: 'https://untrusted.example' } })).status, 403);
    assert.equal((await request('/api/orders', { method: 'POST', headers: { 'X-Studio-Request': '1', 'Content-Type': 'application/json' }, body: '{}' })).status, 400);
    Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, value: 0 });
    assert.equal((await request('/api/products')).status, 503);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    Product.collection.find = originals.find; Product.collection.findOne = originals.findOne; Store.findById = originals.store; User.exists = originals.user;
    if (previous) Object.defineProperty(mongoose.connection, 'readyState', previous); else delete mongoose.connection.readyState;
  }
});
