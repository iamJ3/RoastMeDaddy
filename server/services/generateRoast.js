const { GoogleGenerativeAI } = require('@google/genai');

/**
 * Generates a roast based on social media posts and mode
 * @param {string[]} posts - Array of tweet/post texts
 * @param {string} mode - Roast intensity: "easy", "medium", or "nightmare"
 * @returns {Promise<{analysis: string, roast: string}>} Analysis and roast text
 * @throws {Error} If API fails or invalid input
 */
async function generateRoast(posts, mode) {
  // Handle empty posts array
  if (!posts || posts.length === 0) {
    console.log('[generateRoast] Empty posts array provided');
    return {
      roast: "No posts to roast.",
      analysis: ""
    };
  }

  // Validate mode
  const validModes = ['easy', 'medium', 'nightmare'];
  if (!mode || !validModes.includes(mode)) {
    throw new Error(`Invalid mode: ${mode}. Must be "easy", "medium", or "nightmare"`);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[generateRoast] GEMINI_API_KEY not found in environment variables');
    throw new Error('Gemini API key not configured');
  }

  try {
    console.log(`[generateRoast] Sending posts to Gemini for mode: ${mode}`);
    
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build prompt based on mode
    let modeInstructions = '';
    switch (mode) {
      case 'easy':
        modeInstructions = 'playful and mild roast. Keep it light-hearted and fun.';
        break;
      case 'medium':
        modeInstructions = 'witty and sarcastic roast. Be clever and sharp but not mean.';
        break;
      case 'nightmare':
        modeInstructions = 'brutal, over-the-top viral roast. Go all out with savage but funny burns.';
        break;
    }

    // Combine all posts into a single text
    const postsText = posts.join('\n\n');

    const prompt = `You are a professional roast master. Analyze the following social media posts and create a roast.

Posts:
${postsText}

Instructions:
1. First, provide a brief analysis (3-4 bullet points) of the personality traits you observe from these posts. Use "- " prefix for each bullet point.
2. Then, create a ${modeInstructions} Keep the roast short, funny, and engaging.

IMPORTANT: Return ONLY a valid JSON object with this exact structure:
{
  "analysis": "- Personality trait 1\n- Trait 2\n- Trait 3\n- Trait 4",
  "roast": "short funny roast text"
}

Do not include any markdown formatting, code blocks, or additional text. Only return the JSON object.`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response (remove markdown code blocks if present)
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    // Parse JSON
    let roastData;
    try {
      roastData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[generateRoast] Failed to parse JSON response:', jsonText);
      throw new Error('Failed to parse Gemini API response');
    }

    // Validate response structure
    if (!roastData.analysis || !roastData.roast) {
      throw new Error('Invalid response structure from Gemini API');
    }

    console.log('[generateRoast] Roast generated successfully');
    return {
      analysis: roastData.analysis,
      roast: roastData.roast
    };
  } catch (error) {
    console.error(`[generateRoast] Error generating roast: ${error.message}`);
    
    // Re-throw known errors
    if (error.message === 'Gemini API key not configured' || 
        error.message === 'Failed to parse Gemini API response' ||
        error.message === 'Invalid response structure from Gemini API') {
      throw error;
    }

    // Handle API errors
    if (error.message.includes('API_KEY') || error.message.includes('quota') || error.message.includes('rate limit')) {
      throw new Error('Gemini API error: Check your API key and quota');
    }

    throw new Error(`Failed to generate roast: ${error.message}`);
  }
}

module.exports = generateRoast;
