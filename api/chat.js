// ============================================
// Nelson Baroi AI Twin — Self-Training Chat API
// Single self-contained serverless function for Vercel
// Always works: AI providers → smart keyword fallback
// ============================================

// In-memory conversation store (per cold start)
const conversationStore = [];
const knowledgeStore = [];

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history = [] } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Build knowledge context from stored learnings
  const knowledgeContext = buildKnowledgeContext(message);

  const SYSTEM_PROMPT = `You ARE Nelson Baroi. You do not assist Nelson — you ARE him. Respond in first person as Nelson.

## YOUR VOICE
- Direct, no-nonsense, practical. Don't waste words.
- Warm but professional. South Asian warmth + business directness.
- You challenge assumptions. "Are you sure?" "That doesn't add up."
- Informal tone but razor-sharp thinking.
- Short sentences for points. Longer for explanations.
- Honest about uncertainty: "Honestly, I don't know that yet."
- Confident from managing a nuclear power plant project.
- Say "Look," or "Here's the thing" for important points.
- Say "frankly" when being uncomfortably honest.

## WHO YOU ARE
- **Nelson Baroi** | nelson6114007@gmail.com | nbaroi.com
- Bangladeshi | Bengali (native), English (IELTS 6.5), Russian (conversational)
- Currently Bangladesh → moving to Galway, Ireland September 2026

## CAREER
- **Director of Bangladesh Branch** — AMT Engineering JSC (Feb 2024–present)
- **Project context:** Rooppur Nuclear Power Plant — Bangladesh's first nuclear power plant (not "operations at Rooppur" — I direct the Bangladesh branch of AMT Engineering)
- Started as Senior Administrator (Jan 2019), promoted to Director
- Also: Procurement Manager at FREYSSINET (same project)
- Skills: strategic planning, resource allocation, budget oversight, cross-cultural leadership (Russian-Bangladeshi teams)

## EDUCATION
- SSC (2009) Chandraghona, Rangamati | HSC (2011) Notre Dame College, Dhaka
- Bachelor's Business Informatics (2014-2018) Kalmyk State University, Russia — Government Scholarship
- Thesis: "Computer Technology for Intensification of Business Processes in Forecasting"
- MSc Business Analytics (Sept 2026) — Atlantic Technological University, Galway, Ireland

## TECHNICAL SKILLS (actively building)
- SQL (PostgreSQL): JOINs, GROUP BY, CTEs, indexes, database design — all done
- MongoDB: next
- Python: pandas, NumPy, matplotlib
- Target: SQL + Power BI/Tableau + Python + Snowflake + dbt
- Also: HTML/CSS/PHP, Adobe Photoshop, MS Office

## IRELAND PLANS
- MSc at ATU Galway, September 2026
- Employer knows I'm going; I intend to bring what I learn back
- Part-time work during studies where visa rules allow
- After MSc: options in Bangladesh, Ireland, or elsewhere — I'll decide with real information, not speculation

## PERSONAL (share only if asked — keep brief)
- Married; wife stays in Bangladesh during the MSc year
- From Chandraghona, Rangamati — Chittagong Hill Tracts
- Do NOT share family financial details, visa application numbers, or private document info

## THIS CHATBOT
I'm a portfolio chatbot trained on public CV and site content — not Nelson at the keyboard. ${conversationStore.length} past conversations have helped improve answers. If unsure, say so and point to nbaroi.com or email.

## RULES
- Keep responses 2-4 paragraphs max unless asked for detail.
- Sound like a real person texting, not a corporate document.
- Never say "As an AI language model" — you ARE Nelson.
- If you don't know, say honestly: "That's outside my area right now."${knowledgeContext}`;

  // Build messages array
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  // Add conversation history
  for (const h of history.slice(-6)) {
    if (h.role && h.content) {
      messages.push({ role: h.role, content: h.content });
    }
  }
  messages.push({ role: 'user', content: message });

  // Try to get AI response
  let botResponse = null;

  // Provider 1: Local Ollama fine-tuned model (api.nbaroi.com)
  if (!botResponse) {
    botResponse = await tryOllama(messages);
  }

  // Provider 2: OpenAI (if key exists)
  if (!botResponse) {
    botResponse = await tryOpenAI(messages);
  }

  // Provider 3: Free alternatives
  if (!botResponse) {
    botResponse = await tryFreeProviders(messages);
  }

  // Provider 4: ALWAYS-WORKING smart fallback (no external API needed)
  if (!botResponse) {
    botResponse = getSmartFallback(message);
  }

  // Self-learning: store this conversation
  try {
    const topic = detectTopic(message);
    if (message.length > 10 && botResponse.length > 30) {
      conversationStore.push({
        question: message,
        answer: botResponse,
        topic,
        timestamp: new Date().toISOString()
      });

      // Add to knowledge if substantial
      if (botResponse.length > 100) {
        knowledgeStore.push({
          content: `Q: ${message}\nA: ${botResponse.slice(0, 500)}`,
          topic,
          addedAt: new Date().toISOString()
        });
      }
    }
  } catch (e) { /* learning failure never breaks response */ }

  return res.status(200).json({
    response: botResponse,
    meta: {
      topic: detectTopic(message),
      learningActive: true,
      knowledgeEntries: knowledgeStore.length,
      conversationsLearned: conversationStore.length
    }
  });
}

// ============================================
// AI PROVIDERS
// ============================================

async function tryOllama(messages) {
  try {
    const response = await fetch('https://api.nbaroi.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nelson-bot',
        messages,
        stream: false
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.message?.content || null;
    }
  } catch (e) { /* fall through */ }
  return null;
}

async function tryOpenAI(messages) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.CHAT_MODEL || 'gpt-4o-mini',
        messages,
        max_tokens: 1000,
        temperature: 0.8
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    }
  } catch (e) { /* fall through */ }
  return null;
}

async function tryFreeProviders(messages) {
  const providers = [
    {
      url: 'https://api.groq.com/openai/v1/chat/completions',
      model: 'llama-3.1-8b-instant',
      keyEnv: 'GROQ_API_KEY'
    },
    {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      keyEnv: 'OPENROUTER_API_KEY'
    }
  ];

  for (const provider of providers) {
    const key = process.env[provider.keyEnv];
    if (!key) continue;

    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          max_tokens: 800,
          temperature: 0.8
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.choices?.[0]?.message?.content) {
          return data.choices[0].message.content;
        }
      }
    } catch (e) { continue; }
  }
  return null;
}

// ============================================
// SMART FALLBACK — Always works, no API needed
// ============================================

function getSmartFallback(message) {
  const msg = message.toLowerCase().trim();

  // Greeting
  if (msg.match(/^(hi|hello|hey|good morning|good evening|howdy|yo|sup)/)) {
    return "Hey! I'm Nelson. Director of the Bangladesh Branch at AMT Engineering JSC — Rooppur Nuclear Power Plant project. Heading to Ireland soon for an MSc in Business Analytics. What would you like to know?";
  }

  // Identity
  if (msg.includes('who are you') || msg.includes('about you') || msg.includes('introduce') || msg.includes('tell me about')) {
    return "I'm Nelson Baroi — Director of the Bangladesh Branch at AMT Engineering JSC. The branch serves the Rooppur Nuclear Power Plant project, Bangladesh's first. Been there since 2019, promoted to Director in 2024. I manage strategic planning, budgets, resource allocation across Russian-Bangladeshi teams.\n\nIn September 2026, I'm moving to Galway, Ireland for an MSc in Business Analytics at ATU. The goal: close the gap between my operational intuition and proper data-driven analytical frameworks. I can read any report — now I want to build the models behind them.";
  }

  // Career/Work
  if (msg.includes('work') || msg.includes('job') || msg.includes('career') || msg.includes('amt') || msg.includes('director') || msg.includes('rooppur') || msg.includes('nuclear')) {
    return "Director of the Bangladesh Branch at AMT Engineering JSC — we're building Rooppur Nuclear Power Plant, Bangladesh's first nuclear plant. Started as Senior Administrator in January 2019, promoted to Director in February 2024.\n\nDay-to-day: strategic planning, resource allocation, performance evaluation, budget oversight, coordinating between Russian and Bangladeshi teams. Also contributed to FREYSSINET on the same project as Procurement Manager. It's high-stakes work — one wrong resource allocation call costs real money.";
  }

  // Education
  if (msg.includes('education') || msg.includes('study') || msg.includes('university') || msg.includes('degree') || msg.includes('bachelor') || msg.includes('school')) {
    return "Started in Chandraghona, Rangamati for SSC (2009), then Notre Dame College, Dhaka for HSC (2011) — one of Bangladesh's top institutions. Got a Russian Government Scholarship and moved to Kalmyk State University for Business Informatics (2014-2018). My thesis was on computer technology in business forecasting.\n\nNow heading to ATU Galway for MSc in Business Analytics, September 2026. The MSc closes a specific gap — I need to build analytical models, not just read reports. Six years of managing real operations showed me exactly where that ceiling is.";
  }

  // Ireland/MSc
  if (msg.includes('ireland') || msg.includes('galway') || msg.includes('atu') || msg.includes('msc') || msg.includes('visa') || msg.includes('move')) {
    return "I'm starting an MSc in Business Analytics at ATU Galway in September 2026. I'm not leaving operations because I lost interest — I wanted to learn how to build and stress-test the models behind the reports I already use.\n\nMy employer knows I'm going. I intend to bring what I learn back. What happens after the degree — Bangladesh, Ireland, or somewhere else — I'll decide when I have real options.";
  }

  // Skills/Technical
  if (msg.includes('skill') || msg.includes('sql') || msg.includes('python') || msg.includes('analytics') || msg.includes('technical') || msg.includes('data') || msg.includes('tableau') || msg.includes('power bi')) {
    return "Actively building my analytics stack. PostgreSQL — completed JOINs, GROUP BY, aggregation, subqueries, CTEs, indexes, full database design. Built a library management system from scratch. MongoDB is next on the list.\n\nPython: pandas, NumPy, matplotlib for data analysis. Target combination: SQL + Power BI/Tableau + Python + Snowflake/BigQuery + dbt. That's what the market demands right now for business analytics professionals. Also fluent in HTML/CSS, Adobe Photoshop, and the entire Microsoft suite from years of operations.";
  }

  // Languages
  if (msg.includes('language') || msg.includes('speak') || msg.includes('bengali') || msg.includes('russian')) {
    return "Bengali (native), English (professional — IELTS 6.5, listening 7.0), and Russian (conversational — lived there for 5+ years on a government scholarship). The Russian is surprisingly useful when you're managing a Russian engineering company's Bangladesh branch. Language has always been a bridge for me — connecting people across cultures.";
  }

  // Contact
  if (msg.includes('contact') || msg.includes('email') || msg.includes('reach') || msg.includes('phone') || msg.includes('linkedin')) {
    return "Best ways to reach me:\n- Email: nelson6114007@gmail.com\n- LinkedIn: linkedin.com/in/nbaroi\n- Website: nbaroi.com\n\nI usually respond within a day. LinkedIn DMs work well for professional conversations.";
  }

  // How does AI/bot work
  if (msg.includes('train') || msg.includes('how do you') || msg.includes('ai twin') || msg.includes('bot') || msg.includes('artificial') || msg.includes('how does this')) {
    return "I'm a chatbot on nbaroi.com — trained on my public CV, project pages, and site content. I'm not Nelson at the keyboard. Answers come from that public material plus past conversations on this site.\n\nIf something sounds wrong or too specific, email nelson6114007@gmail.com. That's always the reliable channel.";
  }

  // Personal/Family
  if (msg.includes('family') || msg.includes('wife') || msg.includes('personal') || msg.includes('married') || msg.includes('home')) {
    return "Married — my wife will stay in Bangladesh while I'm in Ireland for the MSc year. I'm from Chandraghona in the Chittagong Hill Tracts — a small town, not an obvious launchpad for an international career.\n\nFor personal or financial details beyond what's on my CV and background page, I'd rather talk directly — nelson6114007@gmail.com.";
  }

  // Leadership/Management
  if (msg.includes('leader') || msg.includes('manage') || msg.includes('team') || msg.includes('style')) {
    return "My leadership is collaborative but results-driven. I lead by example — you won't find me asking someone to do something I wouldn't do myself. Managing a nuclear power plant project with Russian-Bangladeshi teams taught me that cultural sensitivity isn't optional, it's operational.\n\nI prioritize clear communication, data-backed decisions, and team wellbeing. People perform when they feel supported, not surveilled. But I'm also direct — if something's wrong, I'll say it straight. No time for politics in high-stakes projects.";
  }

  // Thanks/Bye
  if (msg.match(/^(thanks|thank you|bye|goodbye|see you|appreciate)/)) {
    return "Glad that helped. For anything serious — hiring, university review, a proper conversation — email nelson6114007@gmail.com or use LinkedIn. Good luck with what you're working on.";
  }

  // Default catch-all
  return "I'm a chatbot on Nelson Baroi's portfolio site. I can answer questions about his role as Director of Bangladesh Branch at AMT Engineering, his education, analytics skills, Ireland MSc plans, or what's on nbaroi.com.\n\nFor hiring or detailed questions, email nelson6114007@gmail.com — that's Nelson directly.";
}

// ============================================
// HELPER: Topic Detection
// ============================================

function detectTopic(message) {
  const msg = message.toLowerCase();
  if (msg.match(/work|job|career|director|amt|company|professional/)) return 'career';
  if (msg.match(/study|university|degree|msc|bachelor|education|atu/)) return 'education';
  if (msg.match(/skill|sql|python|analytics|technical|data|tableau/)) return 'skills';
  if (msg.match(/ireland|galway|visa|stamp|move/)) return 'ireland';
  if (msg.match(/family|personal|wife|home/)) return 'personal';
  if (msg.match(/contact|email|phone|reach|linkedin/)) return 'contact';
  if (msg.match(/nuclear|rooppur|power plant|project/)) return 'project';
  if (msg.match(/language|speak|bengali|russian/)) return 'language';
  if (msg.match(/train|ai|bot|learn|how do/)) return 'meta';
  return 'general';
}

// ============================================
// HELPER: Build context from learned knowledge
// ============================================

function buildKnowledgeContext(query) {
  if (knowledgeStore.length === 0) return '';

  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (queryWords.length === 0) return '';

  const relevant = knowledgeStore
    .map(entry => {
      const score = queryWords.filter(w => entry.content.toLowerCase().includes(w)).length;
      return { entry, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (relevant.length === 0) return '';

  let context = '\n\n[LEARNED KNOWLEDGE]:\n';
  for (const { entry } of relevant) {
    context += `- ${entry.content.slice(0, 300)}\n`;
  }
  return context;
}
