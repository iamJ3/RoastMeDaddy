const express = require('express');
const router = express.Router();

// POST /api/roast
router.post('/', (req, res) => {
  const { platform, username, mode } = req.body;

  // Validate platform
  const validPlatforms = ['x', 'instagram', 'linkedin'];
  if (!platform || !validPlatforms.includes(platform)) {
    return res.status(400).json({ error: 'platform must be "x", "instagram", or "linkedin"' });
  }

  // Validate username
  if (!username || username.trim() === '') {
    return res.status(400).json({ error: 'username must not be empty' });
  }

  // Validate mode
  const validModes = ['easy', 'medium', 'nightmare'];
  if (!mode || !validModes.includes(mode)) {
    return res.status(400).json({ error: 'mode must be "easy", "medium", or "nightmare"' });
  }

  // All validations passed
  res.status(200).json({ message: 'validated' });
});

module.exports = router;
