const mongoose = require('mongoose');

const TabSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  url: String,
  title: String,
  scrollPosition: Number,
  formData: Object,
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('Tab', TabSchema);
