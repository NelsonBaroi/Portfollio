// ============================================
// Nelson Baroi AI Twin — Autonomous Web Scraper
// Scrapes public URLs, extracts knowledge, builds training data
// ============================================

const SCRAPE_SOURCES = [
  {
    url: 'https://nbaroi.com',
    type: 'portfolio',
    label: 'Nelson Portfolio - Main'
  },
  {
    url: 'https://nbaroi.com/philosophy.html',
    type: 'portfolio',
    label: 'Nelson Portfolio - Philosophy'
  },
  {
    url: 'https://nbaroi.com/cv.html',
    type: 'portfolio',
    label: 'Nelson CV'
  },
  {
    url: 'https://nbaroi.com/courses.html',
    type: 'portfolio',
    label: 'Nelson Courses'
  },
  {
    url: 'https://www.linkedin.com/in/nbaroi',
    type: 'linkedin',
    label: 'Nelson LinkedIn'
  },
  {
    url: 'https://en.wikipedia.org/wiki/Rooppur_Nuclear_Power_Plant',
    type: 'reference',
    label: 'Rooppur Nuclear Power Plant'
  },
  {
    url: 'https://www.atu.ie/courses/msc-in-business-analytics',
    type: 'education',
    label: 'ATU MSc Business Analytics'
  },
  {
    url: 'https://atom-alliance.com/en/project/constuction/npp-rooppur/',
    type: 'employer',
    label: 'AMT Engineering - Rooppur'
  }
];

/**
 * Scrape a single URL and extract text content
 */
async function scrapeUrl(url, timeout = 10000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NelsonBaroi-AI-Twin/1.0 (Personal Portfolio Bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, url };
    }

    const html = await response.text();
    const text = extractTextFromHtml(html);
    const metadata = extractMetadata(html);

    return {
      success: true,
      url,
      text: text.slice(0, 15000), // Cap at 15KB per page
      metadata,
      scrapedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      url
    };
  }
}

/**
 * Extract readable text from HTML (no DOM parser needed in edge runtime)
 */
function extractTextFromHtml(html) {
  // Remove script and style tags and their content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');

  // Remove HTML tags but preserve structure
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&[a-z]+;/gi, ' ');

  // Clean up whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n/g, '\n\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();

  return text;
}

/**
 * Extract metadata from HTML
 */
function extractMetadata(html) {
  const meta = {};

  // Title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch) meta.title = titleMatch[1].trim();

  // Meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
  if (descMatch) meta.description = descMatch[1].trim();

  // OG title
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["'](.*?)["']/i);
  if (ogTitleMatch) meta.ogTitle = ogTitleMatch[1].trim();

  return meta;
}

/**
 * Convert scraped text into knowledge entries
 */
function extractKnowledge(scrapedData) {
  const knowledge = [];

  for (const page of scrapedData) {
    if (!page.success || !page.text) continue;

    // Split into paragraphs and extract meaningful ones
    const paragraphs = page.text.split('\n\n').filter(p => p.trim().length > 50);

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (trimmed.length < 50 || trimmed.length > 2000) continue;

      // Skip navigation/boilerplate text
      if (isBoilerplate(trimmed)) continue;

      knowledge.push({
        content: trimmed,
        source: page.url,
        sourceLabel: page.label || page.url,
        type: page.type || 'general',
        extractedAt: new Date().toISOString(),
        relevanceScore: calculateRelevance(trimmed)
      });
    }
  }

  return knowledge;
}

/**
 * Check if text is boilerplate/navigation
 */
function isBoilerplate(text) {
  const boilerplatePatterns = [
    /^(home|about|contact|menu|navigation|search|login|sign)/i,
    /^(copyright|all rights reserved|privacy policy|terms)/i,
    /^(click here|read more|learn more|see all|view all)/i,
    /cookie/i,
    /^\d+\s*(views|likes|shares|comments)/i,
    /^(previous|next|back|forward|skip)/i
  ];

  return boilerplatePatterns.some(pattern => pattern.test(text.trim()));
}

/**
 * Calculate relevance score for a piece of knowledge (0-100)
 */
function calculateRelevance(text) {
  let score = 50; // Base score

  const highRelevanceTerms = [
    'nelson', 'baroi', 'director', 'amt engineering', 'rooppur',
    'nuclear', 'business analytics', 'atu', 'galway', 'ireland',
    'bangladesh', 'operations', 'strategic', 'data', 'analytics',
    'sql', 'python', 'leadership', 'management', 'kalmyk',
    'business informatics', 'procurement', 'freyssinet'
  ];

  const lower = text.toLowerCase();
  for (const term of highRelevanceTerms) {
    if (lower.includes(term)) {
      score += 5;
    }
  }

  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Main scraping function — scrapes all sources and returns knowledge
 */
async function scrapeAllSources() {
  const results = [];

  for (const source of SCRAPE_SOURCES) {
    const result = await scrapeUrl(source.url);
    if (result.success) {
      result.type = source.type;
      result.label = source.label;
    }
    results.push(result);

    // Small delay between requests to be polite
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const knowledge = extractKnowledge(results);

  return {
    scrapedAt: new Date().toISOString(),
    sourcesAttempted: SCRAPE_SOURCES.length,
    sourcesSuccessful: results.filter(r => r.success).length,
    sourcesFailed: results.filter(r => !r.success).map(r => ({ url: r.url, error: r.error })),
    knowledgeExtracted: knowledge.length,
    knowledge
  };
}

/**
 * Scrape a custom URL (for dynamic learning)
 */
async function scrapeCustomUrl(url, label = 'Custom Source') {
  const result = await scrapeUrl(url);
  if (!result.success) return { success: false, error: result.error };

  result.type = 'custom';
  result.label = label;

  const knowledge = extractKnowledge([result]);
  return {
    success: true,
    url,
    knowledgeExtracted: knowledge.length,
    knowledge
  };
}

module.exports = {
  scrapeAllSources,
  scrapeCustomUrl,
  scrapeUrl,
  extractKnowledge,
  extractTextFromHtml,
  SCRAPE_SOURCES
};
