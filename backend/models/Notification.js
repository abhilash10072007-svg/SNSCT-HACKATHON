const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['new_answer', 'answer_upvoted', 'doubt_upvoted', 'answer_accepted', 'mention', 'badge_earned'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedDoubt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doubt'
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
