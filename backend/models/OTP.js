const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['email-verify', 'password-reset', 'login'],
    default: 'email-verify'
  },
  attempts: {
    type: Number,
    default: 0,
    max: [5, 'Too many attempts']
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // TTL index: auto-delete after 10 minutes
  }
});

// Compound index for faster lookups
otpSchema.index({ email: 1, type: 1 });

module.exports = mongoose.model('OTP', otpSchema);
