const { createHmac, timingSafeEqual } = require('node:crypto');
function config() {
  const mode = (process.env.ESEWA_MODE || 'test').toLowerCase();
  if (!['test', 'sandbox', 'production'].includes(mode)) throw new Error('ESEWA_MODE must be test, sandbox or production.');
  const live = mode === 'production';
  return { code: process.env.ESEWA_PRODUCT_CODE, secret: process.env.ESEWA_SECRET_KEY, base: (process.env.PUBLIC_APP_URL || (!live ? 'http://localhost:5173' : ''))?.replace(/\/$/, ''), form: `https://${live ? 'epay' : 'rc-epay'}.esewa.com.np/api/epay/main/v2/form`, status: `https://${live ? 'esewa' : 'rc.esewa'}.com.np/api/epay/transaction/status/` };
}
function configured() { const c = config(); return Boolean(c.code && c.secret && /^https?:\/\//.test(c.base || '')); }
function signature(fields, names, secret) { return createHmac('sha256', secret).update(names.split(',').map(key => `${key}=${fields[key]}`).join(',')).digest('base64'); }
function checkout(order) {
  if (!configured()) throw Error('eSewa is not configured. Please choose cash on delivery.');
  const c = config(), names = 'total_amount,transaction_uuid,product_code';
  const fields = { amount: String(order.subtotal), tax_amount: '0', total_amount: String(order.total), transaction_uuid: String(order._id), product_code: c.code, product_service_charge: '0', product_delivery_charge: String(order.delivery), success_url: c.base + '/api/orders/esewa/return', failure_url: c.base + '/?payment=cancelled', signed_field_names: names };
  fields.signature = signature(fields, names, c.secret);
  return { action: c.form, fields };
}
async function verify(data, order) {
  const c = config();
  const names = 'transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names';
  if (!configured() || data.signed_field_names !== names || data.status !== 'COMPLETE' || data.transaction_uuid !== String(order._id) || data.product_code !== c.code || Number(data.total_amount) !== order.total) return false;
  const actual = Buffer.from(String(data.signature || ''), 'base64'), expected = Buffer.from(signature(data, names, c.secret), 'base64');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  const url = new URL(c.status); url.search = new URLSearchParams({ product_code: c.code, total_amount: String(order.total), transaction_uuid: String(order._id) });
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) return false;
  const result = await response.json();
  return result.status === 'COMPLETE' && result.transaction_uuid === String(order._id) && result.product_code === c.code && Number(result.total_amount) === order.total;
}
module.exports = { configured, checkout, verify, signature };
