// ============================================
// Nelson Baroi AI Twin — Knowledge Base Manager
// Manages the growing knowledge base, deduplicates, scores, prunes
// Uses Vercel KV (Redis) when available, falls back to in-memory + file
// ============================================

// In-memory store (for serverless cold starts, populated from KV or file)
let knowledgeStore = {
  entries: [],
  conversations: [],
  metadata: {
    lastUpdated: null,
    totalScrapes: 0,
    totalConversations: 0,
    version: 1
  }
};

/**
 * Initialize the knowledge store
 */
async function initializeStore(kv = null) {
  if (kv) {
    try {
      const stored = await kv.get('nelson_knowledge_base');
      if (stored) {
        knowledgeStore = JSON.parse(stored);
        return { source: 'kv', entries: knowledgeStore.entries.length };
      }
    } catch (e) {
      console.error('KV read error:', e);
    }
  }

  // Return current in-memory store
  return { source: 'memory', entries: knowledgeStore.entries.length };
}

/**
 * Save the knowledge store
 */
async function saveStore(kv = null) {
  knowledgeStore.metadata.lastUpdated = new Date().toISOString();

  if (kv) {
    try {
      await kv.set('nelson_knowledge_base', JSON.stringify(knowledgeStore));
      return { success: true, storage: 'kv' };
    } catch (e) {
      console.error('KV write error:', e);
    }
  }

  return { success: true, storage: 'memory' };
}

/**
 * Add scraped knowledge entries to the store
 */
function addScrapedKnowledge(entries) {
  let added = 0;
  let duplicates = 0;

  for (const entry of entries) {
    if (isDuplicate(entry)) {
      duplicates++;
      continue;
    }

    knowledgeStore.entries.push({
      ...entry,
      id: generateId(),
      addedAt: new Date().toISOString(),
      accessCount: 0,
      lastAccessed: null
    });
    added++;
  }

  // Keep store manageable (max 500 entries)
  pruneStore();

  knowledgeStore.metadata.totalScrapes++;

  return { added, duplicates, total: knowledgeStore.entries.length };
}

/**
 * Add a conversation for learning
 */
function addConversation(learning) {
  knowledgeStore.conversations.push(learning);
  knowledgeStore.metadata.totalConversations++;

  // Keep only last 200 conversations
  if (knowledgeStore.conversations.length > 200) {
    knowledgeStore.conversations = knowledgeStore.conversations.slice(-200);
  }

  // If the interaction is memorable, also add it as a knowledge entry
  if (learning.shouldRemember && learning.interaction.answer.length > 50) {
    const entry = {
      content: `Q: ${learning.interaction.question}\nA: ${learning.interaction.answer}`,
      source: 'conversation',
      sourceLabel: 'Learned from user interaction',
      type: 'conversation',
      extractedAt: learning.timestamp,
      relevanceScore: 70,
      topic: learning.interaction.topic
    };

    if (!isDuplicate(entry)) {
      knowledgeStore.entries.push({
        ...entry,
        id: generateId(),
        addedAt: new Date().toISOString(),
        accessCount: 0,
        lastAccessed: null
      });
    }
  }
}

/**
 * Search the knowledge base for relevant entries
 */
function searchKnowledge(query, maxResults = 5) {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  if (queryWords.length === 0) return [];

  const scored = knowledgeStore.entries.map(entry => {
    const contentLower = entry.content.toLowerCase();
    let score = 0;

    // Word match scoring
    for (const word of queryWords) {
      if (contentLower.includes(word)) {
        score += 10;
      }
    }

    // Bonus for relevance score
    score += (entry.relevanceScore || 50) / 10;

    // Bonus for recent entries
    if (entry.addedAt) {
      const ageHours = (Date.now() - new Date(entry.addedAt).getTime()) / (1000 * 60 * 60);
      if (ageHours < 24) score += 5;
      else if (ageHours < 168) score += 3; // Last week
    }

    // Bonus for frequently accessed
    score += Math.min(entry.accessCount || 0, 10);

    return { entry, score };
  }).filter(item => item.score > 0);

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Mark as accessed
  const results = scored.slice(0, maxResults).map(item => {
    item.entry.accessCount = (item.entry.accessCount || 0) + 1;
    item.entry.lastAccessed = new Date().toISOString();
    return item.entry;
  });

  return results;
}

/**
 * Check if an entry is a duplicate
 */
function isDuplicate(newEntry) {
  const newFingerprint = newEntry.content.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 100);

  return knowledgeStore.entries.some(existing => {
    const existingFingerprint = existing.content.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 100);

    // Check if fingerprints are very similar (>80% overlap)
    const overlap = calculateOverlap(newFingerprint, existingFingerprint);
    return overlap > 0.8;
  });
}

/**
 * Calculate string overlap ratio
 */
function calculateOverlap(str1, str2) {
  if (!str1 || !str2) return 0;
  const shorter = str1.length < str2.length ? str1 : str2;
  const longer = str1.length >= str2.length ? str1 : str2;

  if (shorter.length === 0) return 0;

  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] === longer[i]) matches++;
  }

  return matches / shorter.length;
}

/**
 * Prune the store to keep it manageable
 */
function pruneStore() {
  const MAX_ENTRIES = 500;

  if (knowledgeStore.entries.length <= MAX_ENTRIES) return;

  // Score each entry for retention
  const scored = knowledgeStore.entries.map(entry => {
    let retentionScore = entry.relevanceScore || 50;
    retentionScore += (entry.accessCount || 0) * 5;

    // Penalize old entries
    if (entry.addedAt) {
      const ageDays = (Date.now() - new Date(entry.addedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays > 30) retentionScore -= 10;
      if (ageDays > 90) retentionScore -= 20;
    }

    // Boost conversation-learned entries (they're proven useful)
    if (entry.source === 'conversation') retentionScore += 15;

    return { entry, retentionScore };
  });

  // Sort by retention score and keep the best
  scored.sort((a, b) => b.retentionScore - a.retentionScore);
  knowledgeStore.entries = scored.slice(0, MAX_ENTRIES).map(s => s.entry);
}

/**
 * Get store statistics
 */
function getStats() {
  const topicCounts = {};
  for (const entry of knowledgeStore.entries) {
    const topic = entry.topic || entry.type || 'general';
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  }

  return {
    totalEntries: knowledgeStore.entries.length,
    totalConversations: knowledgeStore.metadata.totalConversations,
    totalScrapes: knowledgeStore.metadata.totalScrapes,
    lastUpdated: knowledgeStore.metadata.lastUpdated,
    topicDistribution: topicCounts,
    oldestEntry: knowledgeStore.entries.length > 0
      ? knowledgeStore.entries.reduce((oldest, e) =>
          (!oldest.addedAt || e.addedAt < oldest.addedAt) ? e : oldest
        ).addedAt
      : null,
    newestEntry: knowledgeStore.entries.length > 0
      ? knowledgeStore.entries.reduce((newest, e) =>
          (!newest.addedAt || e.addedAt > newest.addedAt) ? e : newest
        ).addedAt
      : null
  };
}

/**
 * Build context string from relevant knowledge for the LLM
 */
function buildContextFromKnowledge(query) {
  const relevant = searchKnowledge(query, 5);

  if (relevant.length === 0) return '';

  let context = '\n\n[KNOWLEDGE BASE — relevant information you\'ve learned]:\n';
  for (const entry of relevant) {
    context += `\n- ${entry.content.slice(0, 400)}\n  (Source: ${entry.sourceLabel || entry.source})\n`;
  }

  return context;
}

/**
 * Generate a unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Export the full knowledge base (for backup/debugging)
 */
function exportKnowledge() {
  return JSON.parse(JSON.stringify(knowledgeStore));
}

module.exports = {
  initializeStore,
  saveStore,
  addScrapedKnowledge,
  addConversation,
  searchKnowledge,
  buildContextFromKnowledge,
  getStats,
  exportKnowledge,
  pruneStore
};
