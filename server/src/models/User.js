const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: ''
  },
  googleId: {
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
