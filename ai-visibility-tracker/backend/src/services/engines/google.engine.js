import logger from '../../utils/logger.js';

// SerpAPI endpoint
const SERP_API_URL = 'https://serpapi.com/search.json';

export async function scanGoogle(prompt, serpApiKey) {
  try {
    // For demo/development without API key, return simulated response
    if (!serpApiKey) {
      logger.warn('Google AIO: No SERP API key provided, returning simulated response');
      return generateSimulatedResponse(prompt);
    }

    // Build API URL
    const params = new URLSearchParams({
      api_key: serpApiKey,
      q: prompt,
      engine: 'google',
      gl: 'us',
      hl: 'en',
      num: 10,
    });

    const response = await fetch(`${SERP_API_URL}?${params}`);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid SERP API key');
      }
      if (response.status === 429) {
        throw new Error('SERP API rate limit exceeded');
      }
      throw new Error(`SERP API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract AI Overview if available
    let aiOverviewText = '';

    // Check for AI Overview (various possible locations in response)
    if (data.ai_overview) {
      if (typeof data.ai_overview === 'string') {
        aiOverviewText = data.ai_overview;
      } else if (data.ai_overview.text) {
        aiOverviewText = data.ai_overview.text;
      } else if (data.ai_overview.text_blocks) {
        aiOverviewText = data.ai_overview.text_blocks.map(b => b.text || b).join('\n\n');
      }
    }

    // Check for answer box as fallback
    if (!aiOverviewText && data.answer_box) {
      if (data.answer_box.answer) {
        aiOverviewText = data.answer_box.answer;
      } else if (data.answer_box.snippet) {
        aiOverviewText = data.answer_box.snippet;
      }
    }

    // Check for knowledge graph
    if (!aiOverviewText && data.knowledge_graph) {
      const kg = data.knowledge_graph;
      aiOverviewText = [
        kg.title,
        kg.type,
        kg.description,
      ].filter(Boolean).join('\n\n');
    }

    // Build response with organic results
    let responseText = '';

    if (aiOverviewText) {
      responseText = `**AI Overview**\n\n${aiOverviewText}`;
    } else {
      responseText = '**No AI Overview available for this query**';
    }

    // Add top organic results
    if (data.organic_results && data.organic_results.length > 0) {
      responseText += '\n\n**Top Search Results:**\n';
      const topResults = data.organic_results.slice(0, 5);
      topResults.forEach((result, index) => {
        responseText += `\n${index + 1}. **${result.title}**\n`;
        responseText += `   ${result.link}\n`;
        if (result.snippet) {
          responseText += `   ${result.snippet}\n`;
        }
      });
    }

    // Add local results if available
    if (data.local_results && data.local_results.places) {
      responseText += '\n\n**Local Results:**\n';
      data.local_results.places.slice(0, 3).forEach(place => {
        responseText += `\n📍 **${place.title}**`;
        if (place.rating) responseText += ` ⭐ ${place.rating}`;
        if (place.reviews) responseText += ` (${place.reviews} reviews)`;
        responseText += '\n';
        if (place.address) responseText += `   ${place.address}\n`;
      });
    }

    return {
      responseText,
      screenshotPath: null, // SERP API doesn't provide screenshots
      organicResults: data.organic_results || [],
      localResults: data.local_results?.places || [],
    };
  } catch (error) {
    logger.error('Google AIO scan error:', error);
    throw error;
  }
}

// Simulated response for development/demo
function generateSimulatedResponse(prompt) {
  const promptLower = prompt.toLowerCase();

  let response = '';

  if (promptLower.includes('best') || promptLower.includes('top')) {
    response = `**AI Overview**

When looking for the best options in this category, consider these highly-rated providers:

📍 **Top Choice Services**
⭐ 4.8/5 (245 reviews)
Known for excellent customer service and quality work.

📍 **Premier Solutions Inc**
⭐ 4.7/5 (189 reviews)
Competitive pricing with comprehensive offerings.

📍 **Quality First Co**
⭐ 4.6/5 (156 reviews)
Established provider with strong local reputation.

**Key factors to consider:**
✅ Check reviews on Google and Yelp
✅ Verify licensing and insurance
✅ Get multiple quotes
✅ Ask for references

_Sources: Google Business Profiles, Local Reviews_

**Top Search Results:**

1. **Best Providers in Your Area - Complete Guide**
   https://example-guide.com/best-providers
   Comprehensive comparison of top-rated providers with reviews and pricing information.

2. **How to Choose the Right Provider**
   https://consumer-advice.com/choosing-guide
   Expert tips on selecting quality services for your needs.

3. **Top 10 Providers Ranked**
   https://ranking-site.com/top-10
   Annual ranking based on customer satisfaction and quality metrics.`;
  } else {
    response = `**AI Overview**

This topic requires careful consideration of several factors. Here's what you should know:

**Important Considerations:**
✅ Research providers thoroughly before deciding
✅ Read recent reviews from multiple sources
✅ Compare pricing and services offered
✅ Verify credentials and experience

**Recommended Steps:**
1. Identify your specific needs
2. Search for providers in your area
3. Check ratings and reviews
4. Request quotes from multiple options
5. Make an informed decision

_Sources: Consumer Guides, Review Platforms_

**Top Search Results:**

1. **Complete Guide to This Topic**
   https://comprehensive-guide.com/topic
   Everything you need to know about making the right choice.

2. **Expert Recommendations**
   https://expert-site.com/recommendations
   Industry experts share their top picks and advice.

3. **Consumer Reviews and Ratings**
   https://review-aggregator.com/category
   Real customer experiences and ratings.`;
  }

  return {
    responseText: response,
    screenshotPath: null,
    organicResults: [],
    localResults: [],
  };
}

export default scanGoogle;
