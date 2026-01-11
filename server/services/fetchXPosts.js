const axios = require('axios');

/**
 * Helper function to sleep for a random duration between min and max milliseconds
 * @param {number} min - Minimum delay in milliseconds
 * @param {number} max - Maximum delay in milliseconds
 * @returns {Promise<void>}
 */
function sleep(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Makes an API request with retry logic for rate limiting (429 errors)
 * @param {Function} apiCall - Function that returns a promise for the API call
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @returns {Promise} API response
 * @throws {Error} If all retries fail or non-rate-limit error occurs
 */
async function makeRequestWithRetry(apiCall, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      // Check if it's a rate limit error (429)
      if (error.response && error.response.status === 429) {
        if (attempt < maxRetries) {
          const delay = Math.floor(Math.random() * 1000) + 1000; // 1-2 seconds
          console.log(`[fetchXPosts] Rate limited. Retry ${attempt}/${maxRetries} after ${delay}ms delay`);
          await sleep(1000, 2000);
          continue;
        } else {
          console.error(`[fetchXPosts] Rate limited. Max retries (${maxRetries}) reached`);
          throw new Error('Twitter API rate limit exceeded. Please try again later.');
        }
      }
      // Re-throw non-rate-limit errors immediately
      throw error;
    }
  }
}

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
    
    const userResponse = await makeRequestWithRetry(() => 
      axios.get(
        `https://api.twitter.com/2/users/by/username/${username}`,
        {
          headers: {
            'Authorization': `Bearer ${bearerToken}`
          }
        }
      )
    );

    // Extract userId from response
    if (!userResponse.data || !userResponse.data.data || !userResponse.data.data.id) {
      console.log(`[fetchXPosts] User not found or private profile: ${username}`);
      throw new Error("Can't roast private profiles lol");
    }

    const userId = userResponse.data.data.id;
    console.log(`[fetchXPosts] UserId found: ${userId}. Fetching tweets...`);

    // Step 2: Get user's tweets
    const tweetsResponse = await makeRequestWithRetry(() =>
      axios.get(
        `https://api.twitter.com/2/users/${userId}/tweets?max_results=10`,
        {
          headers: {
            'Authorization': `Bearer ${bearerToken}`
          }
        }
      )
    );

    // Check if tweets are empty
    if (!tweetsResponse.data || !tweetsResponse.data.data || tweetsResponse.data.data.length === 0) {
      console.log(`[fetchXPosts] No tweets found for user: ${username}`);
      throw new Error("Can't roast private profiles lol");
    }

    // Extract and return array of tweet texts
    const tweetTexts = tweetsResponse.data.data.map(tweet => tweet.text);
    console.log(`[fetchXPosts] Tweets fetched: ${tweetTexts.length} tweets for ${username}`);
    
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
      
      // 429 is already handled in makeRequestWithRetry, but catch it here as fallback
      if (status === 429) {
        throw new Error('Twitter API rate limit exceeded. Please try again later.');
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
        error.message === 'Twitter API bearer token not configured' ||
        error.message === 'Twitter API rate limit exceeded. Please try again later.') {
      throw error;
    }

    // Handle unexpected errors
    console.error(`[fetchXPosts] Unexpected error: ${error.message}`);
    throw new Error(`Failed to fetch X posts: ${error.message}`);
  }
}

module.exports = fetchXPosts;
