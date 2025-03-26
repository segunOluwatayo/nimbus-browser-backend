const mongoose = require('mongoose');

const ConnectedDeviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  deviceId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown',
  },
  browser: String,
  os: String,
  ipAddress: String,
  location: String,
  lastActive: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Compound index to ensure uniqueness for userId + deviceId
ConnectedDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

module.exports = mongoose.model('ConnectedDevice', ConnectedDeviceSchema);