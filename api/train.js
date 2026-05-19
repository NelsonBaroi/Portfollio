// ============================================
// Nelson Baroi AI Twin — Auto-Training Endpoint
// GET /api/train — Status check
// POST /api/train — Trigger scraping + knowledge extraction
// Runs daily via Vercel Cron (vercel.json)
// ============================================

// Scrape sources
const SCRAPE_SOURCES = [
  { url: 'https://nbaroi.com', label: 'Portfolio Main' },
  { url: 'https://nbaroi.com/philosophy.html', label: 'Philosophy' },
  { url: 'https://nbaroi.com/cv.html', label: 'CV Page' },
  { url: 'https://en.wikipedia.org/wiki/Rooppur_Nuclear_Power_Plant', label: 'Rooppur Wikipedia' },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — Status
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ready',
      bot: 'Nelson Baroi AI Twin',
      sources: SCRAPE_SOURCES.length,
      description: 'POST to this endpoint to trigger training. Runs automatically daily at 03:00 UTC.',
      instructions: 'Set TRAIN_SECRET env var. Send POST with Authorization: Bearer <token>'
    });
  }

  // POST — Train
  if (req.method === 'POST') {
    // Simple auth check (allow cron without auth)
    const isCron = req.headers['x-vercel-cron'] === '1';
    if (!isCron) {
      const token = req.headers['authorization']?.replace('Bearer ', '') || req.query?.token;
      const expected = process.env.TRAIN_SECRET || 'nelson-train-2026';
      if (token !== expected) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const report = { triggeredAt: new Date().toISOString(), results: [], errors: [] };

    for (const source of SCRAPE_SOURCES) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(source.url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'NelsonBaroi-AI/2.0' }
        });
        clearTimeout(timeout);

        if (response.ok) {
          const html = await response.text();
          // Extract text (simple HTML strip)
          const text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 5000);

          report.results.push({
            url: source.url,
            label: source.label,
            success: true,
            textLength: text.length
          });
        } else {
          report.errors.push({ url: source.url, status: response.status });
        }
      } catch (e) {
        report.errors.push({ url: source.url, error: e.message });
      }
    }

    report.summary = {
      sourcesScraped: report.results.length,
      sourcesFailed: report.errors.length,
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(report);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
