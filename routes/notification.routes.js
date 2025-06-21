const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const Notification = require('../models/Notification.model');

// Get all notifications for logged-in user
router.get('/', auth, async (req, res) => {
  const notes = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(notes);
});

router.patch('/:id/mark-read', auth, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ message: 'Notification marked as read' });
});

module.exports = router;
