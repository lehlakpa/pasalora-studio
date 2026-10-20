const mongoose = require('mongoose');
const Session = mongoose.model('AdminSession', new mongoose.Schema({
  _id: String, userId: String, refreshHash: String,
  expiresAt: { type: Date, index: { expires: 0 } }
}));
module.exports = { Session };
