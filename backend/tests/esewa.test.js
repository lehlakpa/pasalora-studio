const test = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const esewa = require('../services/esewa');
test('eSewa signs server totals and rejects forged or mismatched payment callbacks', async () => {
  const env = { ...process.env }, original = global.fetch;
  try {
    process.env.ESEWA_MODE = 'sandbox'; process.env.ESEWA_PRODUCT_CODE = 'TEST'; process.env.ESEWA_SECRET_KEY = 'test-secret'; process.env.PUBLIC_APP_URL = 'http://localhost:5173';
    const order = { _id: 'order-123', subtotal: 100, delivery: 10, total: 110 };
    const checkout = esewa.checkout(order);
    assert.equal(checkout.action, 'https://rc-epay.esewa.com.np/api/epay/main/v2/form');
    assert.equal(checkout.fields.signature, createHmac('sha256', 'test-secret').update('total_amount=110,transaction_uuid=order-123,product_code=TEST').digest('base64'));
    const data = { transaction_code: 'ref-1', status: 'COMPLETE', total_amount: 110, transaction_uuid: 'order-123', product_code: 'TEST', signed_field_names: 'transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names' };
    data.signature = esewa.signature(data, data.signed_field_names, 'test-secret');
    global.fetch = async () => Response.json({ ...data });
    assert.equal(await esewa.verify(data, order), true);
    assert.equal(await esewa.verify({ ...data, total_amount: 1 }, order), false);
    assert.equal(await esewa.verify({ ...data, signature: 'fake' }, order), false);
    global.fetch = async () => Response.json({ ...data, status: 'PENDING' });
    assert.equal(await esewa.verify(data, order), false);
    delete process.env.ESEWA_SECRET_KEY; assert.equal(esewa.configured(), false); assert.throws(() => esewa.checkout(order));
  } finally { global.fetch = original; for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key]; Object.assign(process.env, env); }
});
