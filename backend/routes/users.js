const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Doubt = require('../models/Doubt');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @GET /api/users/profile - My profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
});

// @PUT /api/users/profile - Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, bio, subjects, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, subjects, avatar },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, message: 'Profile updated!', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// @PUT /api/users/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
});

// @GET /api/users/:id - Public profile
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email -savedDoubts');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const [doubtsAsked, answersGiven] = await Promise.all([
      Doubt.find({ author: user._id, isAnonymous: false }).select('title status upvoteCount createdAt subject').sort('-createdAt').limit(5),
      Doubt.find({ 'answers.author': user._id }).select('title status subject').limit(5)
    ]);

    res.json({ success: true, user, recentDoubts: doubtsAsked, recentAnswers: answersGiven });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user.' });
  }
});

// @GET /api/users/notifications/all
router.get('/notifications/all', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('relatedUser', 'name avatar')
      .sort('-createdAt')
      .limit(20);
    
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

// @PUT /api/users/notifications/read-all
router.put('/notifications/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
});

// @GET /api/users/leaderboard/top
router.get('/leaderboard/top', protect, async (req, res) => {
  try {
    const leaders = await User.find({ isVerified: true })
      .select('name avatar reputation role doubtsAsked answersGiven badges')
      .sort('-reputation')
      .limit(10);
    res.json({ success: true, leaders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard.' });
  }
});

// @GET /api/users/my-doubts/list
router.get('/my/doubts', protect, async (req, res) => {
  try {
    const doubts = await Doubt.find({ author: req.user._id })
      .sort('-createdAt')
      .select('title subject status upvoteCount answerCount createdAt isAnonymous');
    res.json({ success: true, doubts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch your doubts.' });
  }
});

module.exports = router;
