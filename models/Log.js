const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  ip: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  status: { type: String, enum: ['success', 'failed'], required: true },
  reason: { type: String },
});

module.exports = mongoose.model('Log', logSchema);