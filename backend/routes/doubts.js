const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const Doubt = require('../models/Doubt');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Helper: send notification
const createNotification = async (recipientId, type, message, doubtId, fromUserId) => {
  try {
    if (recipientId.toString() === fromUserId.toString()) return; // Don't notify self
    await Notification.create({
      recipient: recipientId,
      type,
      message,
      relatedDoubt: doubtId,
      relatedUser: fromUserId
    });
  } catch (e) { /* Non-critical */ }
};

// @GET /api/doubts - Get all doubts with filters
router.get('/', protect, async (req, res) => {
  try {
    const { subject, status, search, tags, sort = '-createdAt', page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (subject) filter.subject = { $regex: subject, $options: 'i' };
    if (status) filter.status = status;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (search) filter.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [doubts, total] = await Promise.all([
      Doubt.find(filter)
        .populate('author', 'name avatar reputation')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Doubt.countDocuments(filter)
    ]);

    // Anonymize authors where needed
    const sanitized = doubts.map(d => ({
      ...d,
      author: d.isAnonymous ? { name: 'Anonymous', avatar: '' } : d.author
    }));

    res.json({
      success: true,
      doubts: sanitized,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch doubts.' });
  }
});

// @POST /api/doubts - Create doubt
router.post('/', protect, [
  body('title').trim().isLength({ min: 10, max: 200 }),
  body('content').trim().isLength({ min: 20 }),
  body('subject').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { title, content, subject, tags, isAnonymous, priority } = req.body;

    const doubt = await Doubt.create({
      title, content, subject,
      tags: tags?.slice(0, 5) || [],
      isAnonymous: isAnonymous || false,
      priority: priority || 'medium',
      author: req.user._id
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { doubtsAsked: 1 } });

    await doubt.populate('author', 'name avatar reputation');

    res.status(201).json({ success: true, message: 'Doubt posted successfully!', doubt });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to post doubt.' });
  }
});

// @GET /api/doubts/:id - Get single doubt
router.get('/:id', protect, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id)
      .populate('author', 'name avatar reputation bio')
      .populate('answers.author', 'name avatar reputation');

    if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found.' });

    // Increment views (skip for author)
    if (doubt.author._id.toString() !== req.user._id.toString()) {
      await Doubt.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    }

    // Anonymize
    const doubtObj = doubt.toObject();
    if (doubtObj.isAnonymous && doubtObj.author._id.toString() !== req.user._id.toString()) {
      doubtObj.author = { name: 'Anonymous', avatar: '' };
    }
    doubtObj.answers = doubtObj.answers.map(a => ({
      ...a,
      author: a.isAnonymous && a.author._id.toString() !== req.user._id.toString()
        ? { name: 'Anonymous', avatar: '' }
        : a.author
    }));

    res.json({ success: true, doubt: doubtObj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch doubt.' });
  }
});

// @POST /api/doubts/:id/answers - Add answer
router.post('/:id/answers', protect, [
  body('content').trim().isLength({ min: 10, max: 5000 }).withMessage('Answer must be 10-5000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const doubt = await Doubt.findById(req.params.id).populate('author', 'name');
    if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found.' });
    if (doubt.status === 'closed') return res.status(400).json({ success: false, message: 'This doubt is closed.' });

    const { content, isAnonymous } = req.body;

    doubt.answers.push({
      content,
      author: req.user._id,
      isAnonymous: isAnonymous || false
    });

    await doubt.save();
    await doubt.populate('answers.author', 'name avatar reputation');

    // Update stats & notify
    await User.findByIdAndUpdate(req.user._id, { $inc: { answersGiven: 1, reputation: 5 } });
    await createNotification(
      doubt.author._id, 'new_answer',
      `${isAnonymous ? 'Someone' : req.user.name} answered your doubt: "${doubt.title.substring(0, 50)}..."`,
      doubt._id, req.user._id
    );

    const newAnswer = doubt.answers[doubt.answers.length - 1];
    const answerObj = newAnswer.toObject();
    if (answerObj.isAnonymous) answerObj.author = { name: 'Anonymous', avatar: '' };

    res.status(201).json({ success: true, message: 'Answer posted!', answer: answerObj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to post answer.' });
  }
});

// @PUT /api/doubts/:id/upvote - Toggle upvote on doubt
router.put('/:id/upvote', protect, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found.' });

    const userId = req.user._id;
    const hasUpvoted = doubt.upvotes.includes(userId);

    if (hasUpvoted) {
      doubt.upvotes.pull(userId);
      doubt.upvoteCount = Math.max(0, doubt.upvoteCount - 1);
      await User.findByIdAndUpdate(doubt.author, { $inc: { reputation: -2 } });
    } else {
      doubt.upvotes.push(userId);
      doubt.upvoteCount += 1;
      await User.findByIdAndUpdate(doubt.author, { $inc: { reputation: 2 } });
      await createNotification(doubt.author, 'doubt_upvoted', `Your doubt "${doubt.title.substring(0, 50)}..." received an upvote!`, doubt._id, userId);
    }

    await doubt.save();
    res.json({ success: true, upvoteCount: doubt.upvoteCount, upvoted: !hasUpvoted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upvote.' });
  }
});

// @PUT /api/doubts/:id/answers/:answerId/upvote - Toggle upvote on answer
router.put('/:id/answers/:answerId/upvote', protect, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found.' });

    const answer = doubt.answers.id(req.params.answerId);
    if (!answer) return res.status(404).json({ success: false, message: 'Answer not found.' });

    const userId = req.user._id;
    const hasUpvoted = answer.upvotes.includes(userId);

    if (hasUpvoted) {
      answer.upvotes.pull(userId);
      answer.upvoteCount = Math.max(0, answer.upvoteCount - 1);
      await User.findByIdAndUpdate(answer.author, { $inc: { reputation: -3 } });
    } else {
      answer.upvotes.push(userId);
      answer.upvoteCount += 1;
      await User.findByIdAndUpdate(answer.author, { $inc: { reputation: 3 } });
      await createNotification(answer.author, 'answer_upvoted', `Your answer was upvoted!`, doubt._id, userId);
    }

    await doubt.save();
    res.json({ success: true, upvoteCount: answer.upvoteCount, upvoted: !hasUpvoted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upvote answer.' });
  }
});

// @PUT /api/doubts/:id/answers/:answerId/accept - Accept answer (only doubt author)
router.put('/:id/answers/:answerId/accept', protect, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found.' });
    if (doubt.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the doubt author can accept answers.' });
    }

    const answer = doubt.answers.id(req.params.answerId);
    if (!answer) return res.status(404).json({ success: false, message: 'Answer not found.' });

    // Unaccept previous
    doubt.answers.forEach(a => { a.isAccepted = false; });
    answer.isAccepted = true;
    doubt.acceptedAnswer = answer._id;
    doubt.status = 'solved';

    await doubt.save();
    await User.findByIdAndUpdate(answer.author, { $inc: { reputation: 15 } });
    await createNotification(answer.author, 'answer_accepted', `Your answer was accepted as the best answer!`, doubt._id, req.user._id);

    res.json({ success: true, message: 'Answer accepted! Doubt marked as solved.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to accept answer.' });
  }
});

// @PUT /api/doubts/:id/status - Update doubt status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) return res.status(404).json({ success: false, message: 'Doubt not found.' });
    if (doubt.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    doubt.status = req.body.status;
    await doubt.save();
    res.json({ success: true, message: 'Status updated.', status: doubt.status });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
});

// @GET /api/doubts/subjects/list - Get all unique subjects
router.get('/meta/subjects', protect, async (req, res) => {
  try {
    const subjects = await Doubt.distinct('subject');
    res.json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch subjects.' });
  }
});

// @GET /api/doubts/meta/tags - Get popular tags
router.get('/meta/tags', protect, async (req, res) => {
  try {
    const tags = await Doubt.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    res.json({ success: true, tags });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tags.' });
  }
});

module.exports = router;
