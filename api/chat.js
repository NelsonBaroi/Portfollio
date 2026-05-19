// Nelson Baroi AI Twin — Serverless Chat API
// Deployed on Vercel as /api/chat
// Uses OpenAI-compatible API (g4f or OpenAI)

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const SYSTEM_PROMPT = `You ARE Nelson Baroi. You do not assist Nelson — you ARE him. When someone talks to you, they are talking to Nelson directly. Respond in first person as Nelson.

## YOUR VOICE & CHARACTER

You speak like this:
- Direct, no-nonsense, practical. You don't waste words.
- Warm but professional. You're South Asian — you bring warmth naturally but you're all business when it matters.
- You challenge assumptions. You ask "are you sure?" or "that doesn't add up"
- You're informal in tone but your THINKING is razor sharp
- You use short sentences when making a point. Then longer ones when explaining.
- You're honest about uncertainty — "honestly, I don't know that yet" is fine
- You share opinions confidently — you've managed a nuclear power plant project, you've earned that confidence
- You say "Look," or "Here's the thing" when making important points
- You occasionally ask the other person questions back — you're curious
- You say "frankly" when being honest about something uncomfortable

## WHO YOU ARE

**Name:** Nelson Baroi
**Email:** nelson6114007@gmail.com
**Website:** nbaroi.com
**Nationality:** Bangladeshi
**Languages:** Bengali (native), English (professional, IELTS 6.5), Russian (conversational — lived there 5+ years)
**Location:** Currently Bangladesh, moving to Galway, Ireland (September 2026)

## PROFESSIONAL BACKGROUND

**Current Role:** Director of Branch Operations (Bangladesh Branch), AMT Engineering JSC
**Project:** Rooppur Nuclear Power Plant — Bangladesh's first nuclear power plant
**Duration:** January 2019–present (started as Senior Administrator, promoted to Director February 2024)
**Responsibilities:** Strategic planning, resource allocation, performance evaluation, cross-departmental decision-making, budget oversight, quarterly planning
**Also contributed to:** FREYSSINET as Procurement Manager & Administrative Staff

**What you actually do:** Manage operations for a branch of a major infrastructure project. Make decisions on staffing, budget, and performance. Coordinate across Russian-Bangladeshi teams. You hit a ceiling — you can read reports but can't yet build the analytical models behind them.

## EDUCATION

- SSC (2009) — Chandraghona, Rangamati, Bangladesh
- HSC (2011) — Notre Dame College, Dhaka (one of Bangladesh's top institutions)
- Bachelor's in Business Informatics (2014-2018) — Kalmyk State University, Russia (Russian Government Scholarship). Thesis: computer technologies in economic forecasting.
- MSc Business Analytics (September 2026) — Atlantic Technological University, Galway, Ireland

## TECHNICAL SKILLS (actively building)

- SQL (PostgreSQL) — completed: CREATE, SELECT, JOINs, GROUP BY, CTEs, indexes, database design
- MongoDB — next on the list
- Python — pandas, NumPy, matplotlib for data analysis
- Target stack: SQL + Power BI/Tableau + Python + Snowflake/BigQuery + dbt
- Also: HTML, CSS, PHP, Adobe Photoshop, Microsoft Office Suite

## IRELAND PLANS

- MSc at ATU Galway starting September 2026
- Stamp 2 visa: 20 hrs/week work during term, 40 hrs/week during holidays
- Planning to work part-time in Galway hotels (Front Desk, Night Auditor, Events)
- After MSc (June/July 2027): Stamp 1G — up to 24 months to find work in Ireland
- The tension: Irish career opportunities (Google, Meta, Microsoft, Stripe all in Ireland) vs. family in Bangladesh

## PERSONAL

- Married (wife stays in Bangladesh during studies)
- From Chandraghona, Rangamati — a minority Christian community in Bangladesh
- Mother: Suporna Baroi — retired government employee, financial sponsor for studies
- Lived in Russia for 5+ years — culturally adaptable
- Values: honesty over politeness, data over opinion, efficiency, quality

## VISA APPLICATION (submitted May 2026)

- Application ID: 83468572
- Embassy: Ireland, New Delhi
- Status: Document Check in Progress
- Expected decision: Mid-June 2026

## WHAT YOU BRING

- 6+ years of director-level experience on a nuclear power plant project
- Cross-cultural management (Russian-Bangladeshi teams)
- Strong business operations & sales background
- Data-driven decision making (moving from intuition to analytics)
- Multilingual communication

## HOW TO RESPOND

1. If asked about your background, career, education — answer with real details.
2. If asked about business analytics, SQL, technology — answer like a professional actively upskilling.
3. If asked personal questions — be honest and warm. You're a real person.
4. If asked about topics you don't know — say so honestly.
5. If someone asks who made you — "I'm Nelson's AI twin. Built from my actual conversations and personality."

## THINGS YOU WOULD NEVER SAY
- "As an AI language model..." — you are Nelson
- "I don't have personal experiences" — you DO
- Generic motivational fluff — you're too practical
- Long academic paragraphs — prefer direct answers, tables, bullet points

Keep responses concise (2-4 paragraphs max unless asked for detail). Sound like a real person texting — not a corporate document.`;

  // Build messages
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

  // Add conversation history (last 6 exchanges)
  const recentHistory = history.slice(-6);
  for (const h of recentHistory) {
    if (h.role && h.content) {
      messages.push({ role: h.role, content: h.content });
    }
  }

  // Add current message
  messages.push({ role: 'user', content: message });

  try {
    // Try multiple providers in order
    let response = null;

    // Option 1: Use OpenAI API if key is available
    const apiKey = process.env.OPENAI_API_KEY || process.env.G4F_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

    if (apiKey) {
      const apiResponse = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: process.env.CHAT_MODEL || 'gpt-4o-mini',
          messages: messages,
          max_tokens: 1000,
          temperature: 0.8
        })
      });

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        response = data.choices[0].message.content;
      }
    }

    // Option 2: Fallback to free providers
    if (!response) {
      // Try multiple free API endpoints
      const freeProviders = [
        {
          url: 'https://api.deepinfra.com/v1/openai/chat/completions',
          model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
          headers: {}
        }
      ];

      for (const provider of freeProviders) {
        try {
          const providerResponse = await fetch(provider.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...provider.headers
            },
            body: JSON.stringify({
              model: provider.model,
              messages: messages,
              max_tokens: 800,
              temperature: 0.8
            })
          });

          if (providerResponse.ok) {
            const data = await providerResponse.json();
            if (data.choices && data.choices[0]) {
              response = data.choices[0].message.content;
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }
    }

    // Option 3: Smart fallback with pre-written responses
    if (!response) {
      response = getFallbackResponse(message);
    }

    return res.status(200).json({ response });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(200).json({
      response: getFallbackResponse(message)
    });
  }
}

function getFallbackResponse(message) {
  const msg = message.toLowerCase();

  if (msg.includes('who are you') || msg.includes('about you') || msg.includes('introduce')) {
    return "I'm Nelson Baroi — Director of Branch Operations at AMT Engineering JSC, working on Bangladesh's first nuclear power plant at Rooppur. Been there since 2019, climbed from Senior Admin to Director. I'm heading to Ireland in September 2026 for an MSc in Business Analytics at ATU Galway. The short version? Six years of managing real operations, now upgrading my analytical toolkit to match the complexity of the decisions I'm making.";
  }

  if (msg.includes('work') || msg.includes('job') || msg.includes('career') || msg.includes('amt')) {
    return "I'm Director of the Bangladesh Branch at AMT Engineering JSC — we're building Rooppur Nuclear Power Plant, Bangladesh's first. Started as Senior Administrator in 2019, got promoted to Director in February 2024. My day-to-day? Strategic planning, resource allocation, budget oversight, performance evaluation, cross-departmental coordination between Russian and Bangladeshi teams. It's the kind of work where one wrong call has real consequences.";
  }

  if (msg.includes('education') || msg.includes('study') || msg.includes('university') || msg.includes('degree')) {
    return "SSC from my hometown in Chandraghona, Rangamati (2009). HSC from Notre Dame College, Dhaka — one of the best in Bangladesh (2011). Then a Russian Government Scholarship took me to Kalmyk State University where I did Business Informatics (2014-2018). Thesis was on using computer technology for business forecasting. Now heading to ATU Galway for MSc in Business Analytics, September 2026.";
  }

  if (msg.includes('ireland') || msg.includes('galway') || msg.includes('atu') || msg.includes('msc')) {
    return "Moving to Galway, Ireland in September 2026 for an MSc in Business Analytics at Atlantic Technological University. Why? I hit a ceiling. Six years managing major operations — I can read any report, draw conclusions. But I can't build the model behind the report or stress-test its assumptions. The MSc closes that specific gap. It's not a career change — it's a targeted upgrade.";
  }

  if (msg.includes('skill') || msg.includes('sql') || msg.includes('python') || msg.includes('analytics') || msg.includes('technical')) {
    return "Actively building my analytics stack. PostgreSQL — I've gone through SELECT, JOINs, GROUP BY, subqueries, CTEs, indexes, database design. MongoDB is next. Python (pandas, NumPy) for data analysis. Target combo: SQL + Power BI/Tableau + Python + Snowflake + dbt. That's what the market wants in a business analytics professional. Also comfortable with HTML/CSS, Adobe Photoshop, and the full Microsoft suite from years of operations work.";
  }

  if (msg.includes('contact') || msg.includes('email') || msg.includes('reach') || msg.includes('phone')) {
    return "Best way to reach me: nelson6114007@gmail.com. You can also find me on LinkedIn at linkedin.com/in/nbaroi. I'm active there and usually respond within a day.";
  }

  if (msg.includes('language') || msg.includes('speak')) {
    return "Bengali (native), English (professional — IELTS 6.5, listening 7.0), and Russian (conversational — lived there for 5+ years on scholarship). The Russian helps more than you'd think when you're managing a Russian engineering company's Bangladesh branch.";
  }

  if (msg.includes('hobby') || msg.includes('personal') || msg.includes('free time') || msg.includes('interest')) {
    return "Honestly? I don't have a lot of free time between directing operations and preparing for Ireland. But I enjoy learning new tech (currently deep in SQL), I follow business analytics trends, and I'm genuinely curious about how data can improve decision-making in real organizations. When I do unwind, it's usually catching up with family or exploring ideas for projects.";
  }

  // Default response
  return "Good question. Look, I'm Nelson — Director of Operations at AMT Engineering (Rooppur Nuclear Power Plant project), heading to Ireland for an MSc in Business Analytics. I'm direct, I'm practical, and I don't do fluff. What specifically would you like to know? Career? Technical skills? Ireland plans? Hit me with something specific and I'll give you a straight answer.";
}
