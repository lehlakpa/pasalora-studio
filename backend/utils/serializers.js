const { Types } = require('mongoose');
// Earlier catalogs used ObjectIds; current records use UUID strings.
const idFilter = id => ({ _id: /^[a-f\d]{24}$/i.test(id) ? { $in: [id, new Types.ObjectId(id)] } : id });
const amount = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const imageURL = value => typeof value === 'string' ? value : value?.url || '';
function productJSON(p) {
  return { imageSettings: { fit: p.imageSettings?.fit === 'contain' ? 'contain' : 'cover', x: Number.isFinite(p.imageSettings?.x) ? Math.min(100,Math.max(0,p.imageSettings.x)) : 50, y: Number.isFinite(p.imageSettings?.y) ? Math.min(100,Math.max(0,p.imageSettings.y)) : 50 }, id: String(p._id), name: p.name || p.title || 'Untitled product', description: typeof p.description === 'string' ? p.description : '', category: p.category || 'Other', image: imageURL(p.image) || imageURL(p.images?.[0]), price: amount(p.price), compareAt: amount(p.compareAt), stock: amount(p.stock) };
}
function orderJSON(o) {
  const method = String(o.payment || o.paymentMethod || '').toLowerCase().replace(/[ _-]/g, '');
  const payment = method === 'esewa' ? 'eSewa' : ['cod','cashondelivery'].includes(method) ? 'COD' : o.payment || o.paymentMethod || 'Unknown';
  const paymentStatus = ({ paid: 'Paid', unpaid: 'Unpaid', pending: 'Pending', failed: 'Failed', cancelled: 'Cancelled' })[String(o.paymentStatus || '').toLowerCase()] || o.paymentStatus || 'Unpaid';
  const total = amount(o.total ?? o.amount);
  const quantity = Math.max(1, amount(o.quantity));
  const items = Array.isArray(o.items) ? o.items.filter(Boolean).map(i => ({ productId: String(i.productId || ''), name: i.name || 'Product', price: amount(i.price), quantity: amount(i.quantity) })) : [{ productId: String(o.product || ''), name: o.productTitle || o.title || 'Product', quantity, price: amount(o.unitPrice ?? total / quantity) }];
  return { _id: String(o._id), customer: { name: o.customer?.name || o.customerName || 'Customer details unavailable', phone: o.customer?.phone || o.phoneNumber || '', address: o.customer?.address || o.address || '' }, items, total, delivery: amount(o.delivery), currency: o.currency || 'Rs', paymentStatus, payment, status: o.status || 'Pending', createdAt: o.createdAt };
}
module.exports = { idFilter, productJSON, orderJSON };
