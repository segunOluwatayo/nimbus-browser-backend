const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  url: String,
  title: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  device: String,
}, { timestamps: true });

module.exports = mongoose.model('History', HistorySchema);
