const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  _id: String, requestId: String, transactionUuid: String, requestKey: String, customer: { name: String, phone: String, address: String },
  items: [{ productId: String, name: String, price: Number, quantity: Number, image: String }],
  subtotal: Number, delivery: Number, total: Number, currency: String,
  paymentStatus: { type: String, default: 'Unpaid' }, paymentReference: String, payment: { type: String, default: 'COD' }, status: { type: String, enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });
// Older records have no requestId; only index current checkout requests.
orderSchema.index({ requestId: 1 }, { unique: true, partialFilterExpression: { requestId: { $type: 'string' } } });
const Order = mongoose.model('Order', orderSchema);
module.exports = { Order };
