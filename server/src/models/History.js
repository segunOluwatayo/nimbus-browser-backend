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

// (Optional) A virtual for `id`:
HistorySchema.virtual('id').get(function() {
  return this._id.toHexString();
});

HistorySchema.set('toJSON', {
  virtuals: true // so `id` shows up in toJSON
});

module.exports = mongoose.model('History', HistorySchema);
