const express = require('express');
const router = express.Router();
const fetchXPosts = require('../services/fetchXPosts');

// POST /api/roast
router.post('/', async (req, res) => {
  try {
    const { platform, username, mode } = req.body;

    console.log('POST /api/roast - Request received:', { platform, username, mode });

    // Validate platform
    const validPlatforms = ['x', 'instagram', 'linkedin'];
    if (!platform || !validPlatforms.includes(platform)) {
      console.log('Validation failed: Invalid platform');
      return res.status(400).json({ error: 'platform must be "x", "instagram", or "linkedin"' });
    }

    // Validate username
    if (!username || username.trim() === '') {
      console.log('Validation failed: Empty username');
      return res.status(400).json({ error: 'username must not be empty' });
    }

    // Validate mode
    const validModes = ['easy', 'medium', 'nightmare'];
    if (!mode || !validModes.includes(mode)) {
      console.log('Validation failed: Invalid mode');
      return res.status(400).json({ error: 'mode must be "easy", "medium", or "nightmare"' });
    }

    let posts = [];

    // Handle X platform
    if (platform === "x") {
      console.log(`Fetching tweets for username: ${username}`);
      try {
        posts = await fetchXPosts(username);
        console.log(`Successfully fetched ${posts.length} tweets`);
        console.log("Tweets:", posts);
      } catch (error) {
        console.error('Error fetching X posts:', error.message);
        return res.status(400).json({ error: error.message });
      }
    } else {
      console.log(`Platform "${platform}" not yet implemented. Returning empty posts array.`);
    }

    // Return success response
    const response = {
      platform,
      username,
      mode,
      posts
    };

    console.log('Sending response:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Unexpected error in POST /api/roast:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
