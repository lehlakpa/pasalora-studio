const mongoose = require('mongoose');
const User = mongoose.model('AdminUser', new mongoose.Schema({
  _id: { type: String, default: 'owner' },
  name: { type: String, required: true }, phone: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true, select: false }
}, { timestamps: true }));
module.exports = { User };
