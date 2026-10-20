const test = require('node:test');
const assert = require('node:assert/strict');
const { Order } = require('../models/Order');
const { Product } = require('../models/Product');
const { Store } = require('../models/Store');
const controller = require('../controllers/orders');
const esewa = require('../services/esewa');
test('checkout saves compatible legacy unique keys and returns an eSewa redirect form', async () => {
  const before = { find: Order.findOne, create: Order.create, products: Product.collection.find, store: Store.findById, configured: esewa.configured, checkout: esewa.checkout };
  let saved, result;
  try {
    Order.findOne = async () => null;
    Product.collection.find = () => ({ toArray: async () => [{ _id: 'p1', name: 'Item', price: 100, stock: 5 }] });
    Store.findById = () => ({ lean: async () => ({ document: { settings: { currency: 'Rs', shipping: 1000, deliveryFee: 50 } } }) });
    esewa.configured = () => true;
    esewa.checkout = order => ({ action: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form', fields: { total_amount: order.total } });
    Order.create = async fields => { assert.equal(fields.transactionUuid, fields._id); assert.equal(fields.requestKey, fields.requestId); saved = fields; return fields; };
    const req = { body: { requestId: 'checkout-test-request-123', payment: 'eSewa', customer: { name: 'Test customer', phone: '9800000000', address: 'Test address' }, items: [{ productId: 'p1', quantity: 2 }] } };
    const res = { status(code) { assert.equal(code, 201); return this; }, json(value) { result = value; } };
    await controller.create(req, res);
    assert.equal(saved.paymentStatus, 'Pending'); assert.equal(result.checkout.fields.total_amount, 250); assert.ok(result.orderId);
    Order.create = async () => { throw Object.assign(new Error('legacy index collision'), { code: 11000 }); };
    await assert.rejects(controller.create(req, res), /legacy index collision/);
  } finally { Order.findOne = before.find; Order.create = before.create; Product.collection.find = before.products; Store.findById = before.store; esewa.configured = before.configured; esewa.checkout = before.checkout; }
});
