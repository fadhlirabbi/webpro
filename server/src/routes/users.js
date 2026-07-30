const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Placeholder for user profile routes
router.get('/profile', (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
