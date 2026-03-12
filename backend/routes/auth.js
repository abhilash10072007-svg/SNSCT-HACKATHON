const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateToken } = require('../utils/jwt');
const { generateOTP, sendOTPEmail } = require('../utils/email');
const { protect } = require('../middleware/auth');

// Rate limiters
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Try again in 15 minutes.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again later.' }
});

// @POST /api/auth/register
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ success: false, message: 'Email already registered. Please log in.' });
      }
      // Resend OTP for unverified user
      await OTP.deleteMany({ email, type: 'email-verify' });
      const otp = generateOTP();
      await OTP.create({ email, otp, type: 'email-verify' });
      await sendOTPEmail(email, otp, 'email-verify', existingUser.name);
      return res.status(200).json({ success: true, message: 'OTP resent to your email. Please verify.' });
    }

    const user = await User.create({ name, email, password });

    // Generate & send OTP
    const otp = generateOTP();
    await OTP.create({ email, otp, type: 'email-verify' });
    await sendOTPEmail(email, otp, 'email-verify', name);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for the OTP.',
      email
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// @POST /api/auth/verify-email
router.post('/verify-email', otpLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    const otpRecord = await OTP.findOne({ email: email.toLowerCase(), type: 'email-verify', isUsed: false });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found. Please request a new one.' });
    }

    // Increment attempts
    otpRecord.attempts += 1;
    if (otpRecord.attempts > 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: 'Too many wrong attempts. Please request a new OTP.' });
    }

    if (otpRecord.otp !== otp.toString()) {
      await otpRecord.save();
      return res.status(400).json({ 
        success: false, 
        message: `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.` 
      });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Verify user
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to Smart Doubt Exchange!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        reputation: user.reputation,
        avatar: user.avatar,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// @POST /api/auth/login
router.post('/login', loginLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      // Resend verification OTP
      await OTP.deleteMany({ email, type: 'email-verify' });
      const otp = generateOTP();
      await OTP.create({ email, otp, type: 'email-verify' });
      await sendOTPEmail(email, otp, 'email-verify', user.name);
      return res.status(403).json({
        success: false,
        message: 'Email not verified. A new OTP has been sent to your email.',
        requiresVerification: true,
        email
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        reputation: user.reputation,
        avatar: user.avatar,
        subjects: user.subjects,
        bio: user.bio,
        isVerified: user.isVerified,
        badges: user.badges,
        doubtsAsked: user.doubtsAsked,
        answersGiven: user.answersGiven
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

// @POST /api/auth/forgot-password
router.post('/forgot-password', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    
    // Always return success to prevent email enumeration
    if (!user || !user.isVerified) {
      return res.status(200).json({ success: true, message: 'If that email exists, an OTP has been sent.' });
    }

    await OTP.deleteMany({ email: user.email, type: 'password-reset' });
    const otp = generateOTP();
    await OTP.create({ email: user.email, otp, type: 'password-reset' });
    await sendOTPEmail(user.email, otp, 'password-reset', user.name);

    res.status(200).json({ success: true, message: 'Password reset OTP sent to your email.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const otpRecord = await OTP.findOne({ email: email.toLowerCase(), type: 'password-reset', isUsed: false });
    if (!otpRecord || otpRecord.otp !== otp.toString()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    const user = await User.findOne({ email: email.toLowerCase() });
    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully! Please log in.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @POST /api/auth/resend-otp
router.post('/resend-otp', otpLimiter, async (req, res) => {
  try {
    const { email, type = 'email-verify' } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await OTP.deleteMany({ email: user.email, type });
    const otp = generateOTP();
    await OTP.create({ email: user.email, otp, type });
    await sendOTPEmail(user.email, otp, type, user.name);

    res.status(200).json({ success: true, message: 'New OTP sent to your email.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// @GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

module.exports = router;
