/**
 * Add this file as:  backend/routes/similar.js
 * Then in backend/server.js add:
 *   app.use('/api/similar', require('./routes/similar'));
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Doubt = require('../models/Doubt');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// @POST /api/similar  — find similar doubts for a given title/content
router.post('/', protect, async (req, res) => {
  try {
    const { title, content = '', subject = '' } = req.body;

    if (!title || title.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Title must be at least 5 characters.' });
    }

    // Fetch recent open/solved doubts (exclude very old ones to keep vectors fresh)
    const doubts = await Doubt.find({ status: { $ne: 'closed' } })
      .select('_id title content subject status answerCount')
      .sort('-createdAt')
      .limit(500)          // cap at 500 for performance
      .lean();

    // Call the Python ML service
    const mlRes = await fetch(`${ML_SERVICE_URL}/similar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, subject, doubts, top_n: 5, threshold: 0.25 }),
      signal: AbortSignal.timeout(5000)   // 5-second timeout
    });

    if (!mlRes.ok) {
      console.error('ML service error:', await mlRes.text());
      return res.status(502).json({ success: false, message: 'ML service unavailable.' });
    }

    const data = await mlRes.json();

    return res.json({
      success: true,
      similar: data.similar,      // [{ _id, title, subject, status, answerCount, score }]
      count: data.count,
    });
  } catch (err) {
    console.error('Similar doubts error:', err.message);
    // Graceful fallback — don't break the posting flow
    return res.json({ success: true, similar: [], count: 0 });
  }
});

module.exports = router;