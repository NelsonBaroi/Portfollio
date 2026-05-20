// ============================================================
// Health/status endpoint for the AI twin
// ============================================================

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const providers = [];
  if (process.env.GROQ_API_KEY || true) providers.push('groq'); // default key always present
  if (process.env.GEMINI_API_KEY) providers.push('gemini');
  if (process.env.OPENROUTER_API_KEY) providers.push('openrouter');
  providers.push('smart-fallback');

  return res.status(200).json({
    status: 'online',
    bot: "Nelson's AI Twin",
    version: '3.0.0',
    providers,
    features: [
      'streaming (SSE)',
      'multi-provider fallback',
      'trained personality',
      'confidentiality filter',
      'tool detection (time, calc)',
      'always-on smart fallback',
    ],
    timestamp: new Date().toISOString(),
  });
}
