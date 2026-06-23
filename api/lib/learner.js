// ============================================
// Nelson Baroi AI Twin — Self-Learning Module
// Learns from every conversation, extracts patterns, builds new training data
// ============================================

/**
 * Analyze a conversation exchange and extract learnable knowledge
 */
function learnFromConversation(userMessage, botResponse, context = {}) {
  const learning = {
    timestamp: new Date().toISOString(),
    interaction: {
      question: userMessage,
      answer: botResponse,
      topic: detectTopic(userMessage),
      intent: detectIntent(userMessage)
    },
    insights: extractInsights(userMessage, botResponse),
    shouldRemember: shouldRemember(userMessage, botResponse)
  };

  return learning;
}

/**
 * Detect the topic of a user message
 */
function detectTopic(message) {
  const msg = message.toLowerCase();
  const topicMap = {
    'career': ['work', 'job', 'career', 'position', 'role', 'director', 'amt', 'company', 'professional', 'experience'],
    'education': ['study', 'university', 'degree', 'msc', 'bachelor', 'college', 'school', 'education', 'atu', 'kalmyk'],
    'skills': ['skill', 'sql', 'python', 'analytics', 'technical', 'programming', 'data', 'tableau', 'power bi'],
    'ireland': ['ireland', 'galway', 'atu', 'visa', 'stamp', 'move', 'relocat'],
    'personal': ['family', 'hobby', 'personal', 'wife', 'home', 'free time', 'interest'],
    'contact': ['contact', 'email', 'phone', 'reach', 'connect', 'linkedin'],
    'project': ['rooppur', 'nuclear', 'power plant', 'project', 'construction'],
    'language': ['language', 'speak', 'bengali', 'russian', 'english', 'fluent']
  };

  for (const [topic, keywords] of Object.entries(topicMap)) {
    if (keywords.some(kw => msg.includes(kw))) {
      return topic;
    }
  }

  return 'general';
}

/**
 * Detect the intent behind a user message
 */
function detectIntent(message) {
  const msg = message.toLowerCase();

  if (msg.match(/^(who|what|where|when|why|how|tell|describe|explain)/)) return 'question';
  if (msg.match(/^(can you|could you|would you|please)/)) return 'request';
  if (msg.match(/^(hi|hello|hey|good morning|good evening)/)) return 'greeting';
  if (msg.match(/^(thanks|thank you|appreciate|great|awesome)/)) return 'gratitude';
  if (msg.match(/^(bye|goodbye|see you|talk later)/)) return 'farewell';
  if (msg.includes('?')) return 'question';
  if (msg.match(/^(i think|i believe|in my opinion)/)) return 'opinion';

  return 'statement';
}

/**
 * Extract insights from a conversation exchange
 */
function extractInsights(userMessage, botResponse) {
  const insights = [];

  // Extract any new facts mentioned by the bot
  const factPatterns = [
    /I (?:am|have|was|did|will|can) (.+?)(?:\.|,|$)/g,
    /my (.+?) (?:is|are|was|were) (.+?)(?:\.|,|$)/g
  ];

  for (const pattern of factPatterns) {
    const matches = botResponse.matchAll(pattern);
    for (const match of matches) {
      if (match[0].length > 20 && match[0].length < 200) {
        insights.push({
          type: 'fact',
          content: match[0].trim(),
          confidence: 0.7
        });
      }
    }
  }

  // Extract topics the user is interested in
  const userWords = userMessage.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  if (userWords.length > 0) {
    insights.push({
      type: 'user_interest',
      content: userWords.slice(0, 5).join(', '),
      confidence: 0.5
    });
  }

  return insights;
}

/**
 * Determine if this exchange is worth remembering permanently
 */
function shouldRemember(userMessage, botResponse) {
  // Remember if the bot gave a substantial answer
  if (botResponse.length < 50) return false;

  // Remember if the question is meaningful (not just greetings)
  if (userMessage.length < 10) return false;

  const trivialPatterns = [
    /^(hi|hello|hey|ok|okay|thanks|bye|yes|no|sure|cool)$/i
  ];

  if (trivialPatterns.some(p => p.test(userMessage.trim()))) return false;

  return true;
}

/**
 * Convert a set of learned interactions into training Q&A pairs
 */
function buildTrainingPairs(interactions) {
  const pairs = [];

  for (const interaction of interactions) {
    if (!interaction.shouldRemember) continue;

    const { question, answer, topic } = interaction.interaction;

    // Only keep substantial pairs
    if (question.length > 10 && answer.length > 50) {
      pairs.push({
        question: question.trim(),
        answer: answer.trim(),
        topic,
        learnedAt: interaction.timestamp,
        source: 'conversation'
      });
    }
  }

  return deduplicatePairs(pairs);
}

/**
 * Deduplicate training pairs based on similarity
 */
function deduplicatePairs(pairs) {
  const seen = new Set();
  const unique = [];

  for (const pair of pairs) {
    // Create a fingerprint from the first 50 chars of the question
    const fingerprint = pair.question.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50);

    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      unique.push(pair);
    }
  }

  return unique;
}

/**
 * Analyze conversation patterns to identify knowledge gaps
 */
function identifyKnowledgeGaps(interactions) {
  const unansweredTopics = {};
  const errorResponses = [];

  for (const interaction of interactions) {
    const { question, answer, topic } = interaction.interaction;

    // Detect when the bot couldn't answer properly
    if (answer.includes("don't know") || answer.includes("not sure") ||
        answer.includes("can't help") || answer.includes("outside my area")) {
      if (!unansweredTopics[topic]) {
        unansweredTopics[topic] = [];
      }
      unansweredTopics[topic].push(question);
    }

    // Detect error responses
    if (answer.includes("something went wrong") || answer.includes("try again")) {
      errorResponses.push({ question, timestamp: interaction.timestamp });
    }
  }

  return {
    gaps: unansweredTopics,
    errors: errorResponses,
    recommendations: generateRecommendations(unansweredTopics)
  };
}

/**
 * Generate recommendations for filling knowledge gaps
 */
function generateRecommendations(gaps) {
  const recommendations = [];

  for (const [topic, questions] of Object.entries(gaps)) {
    if (questions.length >= 2) {
      recommendations.push({
        topic,
        priority: questions.length,
        suggestion: `Users frequently ask about "${topic}" — consider adding more training data for this area.`,
        sampleQuestions: questions.slice(0, 3)
      });
    }
  }

  return recommendations.sort((a, b) => b.priority - a.priority);
}

module.exports = {
  learnFromConversation,
  buildTrainingPairs,
  identifyKnowledgeGaps,
  detectTopic,
  detectIntent,
  deduplicatePairs
};
