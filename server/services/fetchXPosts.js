const axios = require('axios');

/**
 * Fetches X (Twitter) posts for a given username
 * @param {string} username - Twitter username (without @)
 * @returns {Promise<string[]>} Array of tweet texts
 * @throws {Error} If user not found, no tweets, or API fails
 */
async function fetchXPosts(username) {
  const bearerToken = process.env.TWITTER_BEARER;

  // Validate bearer token
  if (!bearerToken) {
    console.error('TWITTER_BEARER not found in environment variables');
    throw new Error('Twitter API bearer token not configured');
  }

  try {
    // Step 1: Get user ID from username
    console.log(`[fetchXPosts] Fetching userId for username: ${username}`);
    const userResponse = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        }
      }
    );

    // Extract userId from response
    if (!userResponse.data || !userResponse.data.data || !userResponse.data.data.id) {
      console.log(`[fetchXPosts] User not found or private profile: ${username}`);
      throw new Error("Can't roast private profiles lol");
    }

    const userId = userResponse.data.data.id;
    console.log(`[fetchXPosts] UserId found: ${userId}. Fetching tweets...`);

    // Step 2: Get user's tweets
    const tweetsResponse = await axios.get(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=10`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        }
      }
    );

    // Check if tweets are empty
    if (!tweetsResponse.data || !tweetsResponse.data.data || tweetsResponse.data.data.length === 0) {
      console.log(`[fetchXPosts] No tweets found for user: ${username}`);
      throw new Error("Can't roast private profiles lol");
    }

    // Extract and return array of tweet texts
    const tweetTexts = tweetsResponse.data.data.map(tweet => tweet.text);
    console.log(`[fetchXPosts] Successfully fetched ${tweetTexts.length} tweets for ${username}`);
    
    return tweetTexts;
  } catch (error) {
    // Handle API errors
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;
      
      console.error(`[fetchXPosts] Twitter API error: ${status} - ${statusText}`);
      
      if (status === 404) {
        throw new Error("Can't roast private profiles lol");
      }
      
      if (status === 401 || status === 403) {
        throw new Error(`Twitter API authentication failed: ${statusText}`);
      }
      
      throw new Error(`Twitter API error: ${status} - ${statusText}`);
    }

    // Handle network errors
    if (error.request) {
      console.error('[fetchXPosts] Network error: No response received from Twitter API');
      throw new Error('Network error: Failed to connect to Twitter API');
    }

    // Re-throw known errors
    if (error.message === "Can't roast private profiles lol" || 
        error.message === 'Twitter API bearer token not configured') {
      throw error;
    }

    // Handle unexpected errors
    console.error(`[fetchXPosts] Unexpected error: ${error.message}`);
    throw new Error(`Failed to fetch X posts: ${error.message}`);
  }
}

module.exports = fetchXPosts;
