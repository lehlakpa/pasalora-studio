const test = require('node:test');
const assert = require('node:assert/strict');
const { Types } = require('mongoose');
const { productJSON, orderJSON, idFilter } = require('../utils/serializers');
test('legacy products have stable IDs, category and image strings', () => {
  const id = new Types.ObjectId();
  const p = productJSON({ _id: id, title: 'Linen shirt', images: [{ url: 'https://example.com/shirt.png' }], price: 1200 });
  assert.equal(p.id, id.toHexString()); assert.equal(p.category, 'Other'); assert.equal(p.name, 'Linen shirt'); assert.equal(p.stock, 0); assert.equal(p.image, 'https://example.com/shirt.png');
});
test('legacy COD and payment records become renderable orders without exposing private fields', () => {
  const cod = orderJSON({ _id: new Types.ObjectId(), customerName: 'Test customer', phoneNumber: '1234567', address: 'Test address', productTitle: 'Shirt', quantity: 2, unitPrice: 100, total: 200, paymentMethod: 'COD', guestTokenHash: 'private' });
  assert.equal(typeof cod._id, 'string'); assert.equal(cod.customer.name, 'Test customer'); assert.equal(cod.items[0].quantity, 2); assert.equal(cod.items[0].price, 100); assert.equal(cod.guestTokenHash, undefined);
  const payment = orderJSON({ _id: new Types.ObjectId(), title: 'Bag', amount: 350, paymentMethod: 'esewa' });
  assert.equal(payment.total, 350); assert.equal(payment.items[0].price, 350); assert.equal(payment.payment, 'eSewa'); assert.equal(payment.status, 'Pending'); assert.ok(payment.customer);
});
test('current UUID records retain details and legacy updates target either ID type', () => {
  const order = orderJSON({ _id: 'uuid-123', customer: { name: 'Test' }, items: [{ productId: 'p1', name: 'Bag', price: 100, quantity: 2 }], total: 220, delivery: 20, currency: 'Rs', payment: 'COD', status: 'Shipped' });
  assert.equal(order.status, 'Shipped'); assert.equal(order.items.length, 1); assert.equal(order.total, 220);
  assert.deepEqual(idFilter('uuid-123'), { _id: 'uuid-123' });
  const hex = new Types.ObjectId().toHexString(); assert.equal(idFilter(hex)._id.$in[1].toHexString(), hex);
});

test('product image settings survive validation and serialization', () => {
  const { fields } = require('../utils/productFields');
  const input = { name: 'Photo test', category: 'Other', price: 100, stock: 2, imageSettings: { fit: 'contain', x: 20, y: 80 } };
  const parsed = fields(input);
  assert.deepEqual(parsed.imageSettings, input.imageSettings);
  assert.deepEqual(productJSON({ _id: 'image-test', ...parsed }).imageSettings, input.imageSettings);
  assert.equal(fields({ ...input, imageSettings: { fit: 'cover', x: 101, y: 50 } }), null);
  assert.equal(fields({ ...input, imageSettings: { fit: 'invalid', x: 50, y: 50 } }), null);
  assert.deepEqual(productJSON({ _id: 'legacy' }).imageSettings, { fit: 'cover', x: 50, y: 50 });
});

test('old payment names and paid status normalize for admin filters', () => {
  assert.equal(orderJSON({ _id: 'one', paymentMethod: 'cash_on_delivery' }).payment, 'COD');
  const paid = orderJSON({ _id: 'two', paymentMethod: 'esewa', paymentStatus: 'paid' });
  assert.equal(paid.payment, 'eSewa'); assert.equal(paid.paymentStatus, 'Paid');
});
