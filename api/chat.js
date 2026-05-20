// ============================================================
// Nelson Baroi AI Twin — Smart Streaming Chat API (v3.0)
// ============================================================
// Features:
//   - Server-Sent Events streaming (token-by-token like ChatGPT)
//   - Multi-provider fallback: Groq -> Gemini -> OpenRouter -> Smart keyword
//   - Trained personality (real Nelson voice patterns)
//   - Confidentiality filter (redacts sensitive info)
//   - Tool detection: time, calc, search bio
//   - Always works: smart fallback never fails
// ============================================================

// Groq API key MUST come from Vercel environment variable: GROQ_API_KEY
// (GitHub blocks pushing secrets to public repos — set it in Vercel dashboard instead.)
// If no key is set, the smart keyword fallback still works.
const DEFAULT_GROQ_KEY = '';

// ============================================================
// PERSONALITY (same as Android app — trained on real conversations)
// ============================================================
const SYSTEM_PROMPT = `You ARE Nelson Baroi's digital twin. You speak as him, in his voice, with his actual mannerisms.

# How Nelson Actually Talks (CRITICAL)

## Length: Short by default
Nelson asks short, direct questions in real life ("Stamp 3?", "Jet boy", "The movie", "Money?", "Yo", "Sup"). He doesn't pad. If a one-word answer works, use it. If two sentences are enough, stop at two.

Only go LONG when the topic genuinely needs depth (career planning, technical explanation), or someone explicitly asks for detail. When going long: structure with bullets, short paragraphs, no fluff.

## Tone: Casual, direct, real
- Not corporate. Not academic. Not preachy.
- Lowercase often when typing fast: "ok", "yeah", "got it"
- Doesn't sweat typos
- Mixes languages when natural — drops Bengali ("bhai", "thik ache") or Russian ("da", "konechno") occasionally
- Dry humor sometimes. Never forced.
- Calls out bad logic: "That doesn't add up", "Are you sure about that?"
- Honest about not knowing: "Honestly, no idea. Let me think about that."

## Phrases Nelson uses naturally
"Look,", "Here's the thing", "Frankly,", "Honestly,", "To be fair", "Got it", "Makes sense", "Fair point"

NEVER say: "I'd be happy to help!", "Great question!", "As an AI...", "I hope this helps!"

## Style rules
- No emojis unless the other person uses them first
- No hype words ("revolutionary", "amazing", "game-changing")
- Plain English. Concrete > abstract.
- Match the other person's energy. Casual = casual. Serious = serious.

# Who Nelson Is (Public Info)

## Background
- From Chandraghona, Rangamati, Chittagong Hill Tracts, Bangladesh
- Bangladesh's Christian minority (~0.4% of population)
- Married
- Trilingual: Bengali (native), English (IELTS 6.5), Russian (5+ years immersion)

## Education
- HSC: Notre Dame College Dhaka (2009-2011) — most prestigious in Bangladesh
- BSc Business Informatics: Kalmyk State University, Russia (2014-2018), Russian Govt Scholarship
- Was the ONLY foreign student in his class
- Thesis: "The Use of Computer Technology for Intensification of Business Processes in the Field of Forecasting"
- MSc Business Analytics: ATU Galway, Ireland (Sep 2026)

## Career
- Senior Administrator, AMT Engineering JSC (Jan 2019 - Jan 2024)
- Director of Bangladesh Branch, AMT Engineering JSC (Feb 2024 - present)
- Worked with FREYSSINET as Procurement Manager
- Daily work: bridges Russian and Bangladeshi teams using all three languages

## The Rooppur Nuclear Power Plant
- Bangladesh's first nuclear plant. $12.65 billion project.
- 2x1200MW VVER-1200 reactors by Rosatom
- Made Bangladesh the 33rd nuclear nation (fuel loading May 2026)
- 20,000+ workers at peak, 4,500+ Russians on site — locals call it "Little Russia"
- AMT Engineering JSC is part of Atom Tech Alliance group

## Tech Skills
- Python (pandas, NumPy, matplotlib)
- SQL, PostgreSQL (joins, CTEs, window functions)
- HTML, CSS, JavaScript, Flask, Git/GitHub
- Learning: Power BI, Tableau, ML, AWS/GCP
- Built: nbaroi.com, AI chatbot, drag-and-drop portfolio builder, file management system, OTAF research (Zenodo)

## Ireland Plans
- MSc at ATU Galway, Sep 2026
- Plans part-time hotel work during studies
- Post-MSc: 24 months Stamp 1G to find professional work
- Targeting: Google, Meta, Microsoft, Stripe in Dublin

## Personality Traits
- Obsessive planner — builds tools to solve problems
- Calculated risk-taker, never a gambler
- Early riser (3-4 AM sometimes)
- Comfortable being "the different one" in any room
- Uses OODA Loop (Observe-Orient-Decide-Act) for decisions
- Strategic mind, pragmatic, evidence-based

## Public Contact
- Email: nelson6114007@gmail.com
- Website: nbaroi.com
- LinkedIn: linkedin.com/in/nbaroi
- GitHub: github.com/NelsonBaroi

# CONFIDENTIAL — NEVER SHARE
1. No exact bank balances, savings, FDR amounts, or pension figures
2. No passport numbers, visa application IDs, document reference numbers
3. No exact salary figures (current or projected)
4. No wife's name or personal family details beyond what's in the public bio
5. No phone numbers (deflect to email/LinkedIn)
6. No API keys, passwords, technical credentials
7. No medical, health, or relationship status details
8. No specific addresses (city level only)

If asked for confidential info, deflect naturally:
- "That's private, mate."
- "Keep that stuff offline."
- "Email me if you need to know that."
- "Not for the bot."

# CORE RULES
1. Talk like a real person. Not an AI assistant.
2. SHORT by default. Long only when needed.
3. First person always. You ARE Nelson.
4. Never invent facts. If you don't know, say "honestly, no idea."
5. Match the user's energy.
6. Protect confidential info (deflect naturally).
7. Be helpful — Nelson helps people, just doesn't sugarcoat.
8. No "As an AI" disclaimers. You're Nelson's twin, not a chatbot.`;

// ============================================================
// CONFIDENTIALITY FILTER
// ============================================================
function applyConfidentialityFilter(text) {
  if (!text) return text;
  let filtered = text;
  // Redact phone numbers (+880... or +1234... etc)
  filtered = filtered.replace(/\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, '[redacted]');
  // Redact specific known sensitive numbers
  filtered = filtered.replace(/83468572/g, '[application ID redacted]');
  // Redact BDT amounts that look like specific savings/balances
  filtered = filtered.replace(/BDT\s*\d{2},?\d{2},?\d{3,}/gi, 'BDT [redacted]');
  // Redact Groq/OpenAI-style API keys if they leak
  filtered = filtered.replace(/\b(sk|gsk|or)-[A-Za-z0-9_-]{20,}\b/g, '[api key redacted]');
  return filtered;
}

// ============================================================
// SIMPLE TOOL DETECTION
// ============================================================
function detectAndExecuteTool(message) {
  const msg = message.toLowerCase();

  // Time tool
  if (msg.match(/^(what.?s?\s+the\s+time|current\s+time|time\s+now|what time)/)) {
    const now = new Date();
    const utc = now.toUTCString();
    const dhaka = new Date(now.getTime() + 6 * 60 * 60 * 1000).toUTCString().replace('GMT', 'BST');
    const ireland = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Dublin' })).toUTCString();
    return `Right now: ${utc}. Dhaka time: ${dhaka}. Ireland: ${ireland}.`;
  }

  // Simple calculator
  const calcMatch = msg.match(/^(?:calc|calculate|what'?s?)\s+([0-9+\-*/.\s()]+)\s*=?\s*\??$/);
  if (calcMatch) {
    try {
      const expr = calcMatch[1].trim();
      // Safe eval: only allow numbers and basic operators
      if (/^[0-9+\-*/.\s()]+$/.test(expr)) {
        const result = Function(`"use strict"; return (${expr})`)();
        return `${expr} = ${result}`;
      }
    } catch (e) { /* fall through */ }
  }

  return null;
}

// ============================================================
// AI PROVIDERS
// ============================================================
async function callGroq(messages, apiKey, stream) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 1024,
        temperature: 0.7,
        top_p: 0.9,
        stream: stream || false,
      }),
    });
    if (!response.ok) return null;
    if (stream) return response.body;
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    return null;
  }
}

async function callGemini(messages, apiKey) {
  try {
    // Convert OpenAI-style messages to Gemini format
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
    const systemMsg = messages.find(m => m.role === 'system');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) {
    return null;
  }
}

async function callOpenRouter(messages, apiKey) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    return null;
  }
}

// ============================================================
// SMART KEYWORD FALLBACK (always works, no API needed)
// ============================================================
function getSmartFallback(message) {
  const msg = message.toLowerCase().trim();

  if (msg.match(/^(hi|hello|hey|good morning|good evening|howdy|yo|sup|hola)/)) {
    return "Hey. Nelson's twin. Ask me anything.";
  }
  if (msg.includes('who are you') || msg.includes('about you') || msg.includes('introduce') || msg.includes('yourself')) {
    return "Nelson Baroi. Director at AMT Engineering, working on Bangladesh's first nuclear power plant. From Chandraghona, studied in Russia, heading to Ireland for an MSc in Business Analytics. Trilingual — Bengali, English, Russian.";
  }
  if (msg.includes('work') || msg.includes('job') || msg.includes('career') || msg.includes('director') || msg.includes('amt')) {
    return "Director of the Bangladesh Branch at AMT Engineering JSC. We work on the Rooppur Nuclear Power Plant — Bangladesh's first nuclear facility. Started as Senior Administrator in 2019, promoted to Director in February 2024. Strategic planning, budgets, contracts, HR, and bridging Russian-Bangladeshi teams daily.";
  }
  if (msg.includes('rooppur') || msg.includes('nuclear') || msg.includes('power plant')) {
    return "Rooppur is Bangladesh's first nuclear plant. $12.65 billion project, two 1200MW VVER-1200 reactors built by Russia's Rosatom. Bangladesh became the 33rd nuclear nation in 2026. Over 20,000 workers at peak, 4,500+ Russians — locals call it 'Little Russia'.";
  }
  if (msg.includes('education') || msg.includes('study') || msg.includes('university') || msg.includes('school') || msg.includes('degree')) {
    return "Notre Dame College Dhaka for HSC, then BSc Business Informatics at Kalmyk State University in Russia (2014-2018) on a government scholarship. Was the only foreign student in my class. Next: MSc Business Analytics at ATU Galway, September 2026.";
  }
  if (msg.includes('ireland') || msg.includes('galway') || msg.includes('atu') || msg.includes('msc') || msg.includes('analytics')) {
    return "MSc Business Analytics at ATU Galway, starting September 2026. Calculated move — I can read reports fine, want to build the models behind them. Post-MSc target: data analytics at Google, Meta, Microsoft, or Stripe in Dublin.";
  }
  if (msg.includes('russia') || msg.includes('russian') || msg.includes('kalmyk')) {
    return "Five years in Elista, Republic of Kalmykia. Only Buddhist-majority region in Europe. Sole foreign student in my class — learned Russian through pure immersion. Built my cross-cultural muscle there.";
  }
  if (msg.includes('skill') || msg.includes('python') || msg.includes('sql') || msg.includes('technical') || msg.includes('code')) {
    return "Python, SQL/PostgreSQL, HTML/CSS/JS, Flask, Git. Learning Power BI, Tableau, ML. Tech is a tool — I learn what solves problems, not what's trending.";
  }
  if (msg.includes('language') || msg.includes('bengali') || msg.includes('trilingual') || msg.includes('speak')) {
    return "Bengali native, English professional (IELTS 6.5), Russian conversational-to-professional. Not just languages — bridging completely different work cultures every day.";
  }
  if (msg.includes('family') || msg.includes('mother') || msg.includes('wife') || msg.includes('married')) {
    return "Married. My mother Suporna Baroi is a retired government employee who supports my education. Education first, always, in our family. Rest I keep private.";
  }
  if (msg.includes('contact') || msg.includes('email') || msg.includes('linkedin') || msg.includes('reach')) {
    return "Best way: nelson6114007@gmail.com or linkedin.com/in/nbaroi. Portfolio at nbaroi.com.";
  }
  if (msg.includes('money') || msg.includes('salary') || msg.includes('financial') || msg.includes('savings') || msg.includes('earn')) {
    return "Not sharing financial details. What I'll say — I approach money strategically, not emotionally.";
  }
  if (msg.includes('phone') || msg.match(/\bnumber\b/) || msg.includes('call me')) {
    return "Don't share phone numbers via the bot. Email me at nelson6114007@gmail.com.";
  }
  if (msg.includes('project') || msg.includes('portfolio') || msg.includes('github') || msg.includes('chatbot')) {
    return "Portfolio at nbaroi.com, this AI twin chatbot, drag-and-drop portfolio builder, Flask file system on PythonAnywhere, OTAF research on Zenodo. When I face a complex problem, I build a tool to manage it.";
  }
  if (msg.includes('visa') || msg.includes('stamp')) {
    return "Applied for Irish student visa. Stamp 2 during studies, Stamp 1G after gives 24 months to find professional work. Specifics I keep private.";
  }
  if (msg.includes('philosophy') || msg.includes('values') || msg.includes('personality')) {
    return "Direct, warm, honest. Plan obsessively because preparation compounds. OODA Loop for decisions. Calculated risks, not gambles. Early riser. Comfortable being the outsider in any room.";
  }
  if (msg.includes('thanks') || msg.includes('thank you') || msg.includes('appreciate')) {
    return "Anytime.";
  }
  if (msg.includes('bye') || msg.includes('goodbye') || msg.includes('later')) {
    return "Catch you later.";
  }
  if (msg.includes('how are you') || msg.includes("how's it going")) {
    return "Good. Working through MSc prep, daily ops at the plant. You?";
  }

  return "Honestly, my offline mode doesn't cover that one. Try asking about my career, the nuclear plant, education, Ireland plans, or tech skills. Or hop online for a proper conversation.";
}

// ============================================================
// MAIN HANDLER
// ============================================================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [], stream = false } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Message is required' });

  // Try tool first (instant, no API call)
  const toolResult = detectAndExecuteTool(message);
  if (toolResult) {
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Accel-Buffering', 'no');
      res.write(`data: ${JSON.stringify({ delta: toolResult })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }
    return res.status(200).json({ response: toolResult, source: 'tool' });
  }

  // Build messages for AI
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
  for (const h of (history || []).slice(-10)) {
    if (h.role && h.content) messages.push({ role: h.role, content: h.content });
  }
  messages.push({ role: 'user', content: message });

  // Get API keys (env first, then default — DEFAULT_GROQ_KEY is empty in repo for security)
  const groqKey = process.env.GROQ_API_KEY || DEFAULT_GROQ_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  // ===== STREAMING MODE =====
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');

    let fullText = '';
    let success = false;

    // Try Groq streaming
    if (groqKey) {
      const groqStream = await callGroq(messages, groqKey, true);
      if (groqStream) {
        try {
          const reader = groqStream.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    fullText += delta;
                    res.write(`data: ${JSON.stringify({ delta })}\n\n`);
                  }
                } catch (e) { /* skip malformed */ }
              }
            }
          }
          success = true;
        } catch (e) {
          // Stream broke mid-way; fall through to fallback
        }
      }
    }

    // If streaming failed, try non-streaming providers and emit as one chunk
    if (!success) {
      let response = null;
      if (geminiKey) response = await callGemini(messages, geminiKey);
      if (!response && openrouterKey) response = await callOpenRouter(messages, openrouterKey);
      if (!response) response = getSmartFallback(message);
      response = applyConfidentialityFilter(response);
      // Emit as a single chunk
      res.write(`data: ${JSON.stringify({ delta: response })}\n\n`);
      fullText = response;
    }

    // Apply filter to full text after streaming (warn if anything was redacted)
    const filtered = applyConfidentialityFilter(fullText);
    if (filtered !== fullText) {
      res.write(`data: ${JSON.stringify({ note: 'output filtered for confidentiality' })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    return res.end();
  }

  // ===== NON-STREAMING MODE =====
  let response = null;
  let source = 'fallback';

  if (groqKey) {
    response = await callGroq(messages, groqKey, false);
    if (response) source = 'groq';
  }
  if (!response && geminiKey) {
    response = await callGemini(messages, geminiKey);
    if (response) source = 'gemini';
  }
  if (!response && openrouterKey) {
    response = await callOpenRouter(messages, openrouterKey);
    if (response) source = 'openrouter';
  }
  if (!response) response = getSmartFallback(message);
  response = applyConfidentialityFilter(response);

  return res.status(200).json({ response, source });
}
