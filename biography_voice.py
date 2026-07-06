"""Convert third-person biography markdown into Nelson's first-person voice."""
import re

SECTION_TITLES = {
    "I": "Where I'm From",
    "II": "Family",
    "III": "School Years",
    "IV": "Russia",
    "V": "Rooppur — Bangladesh's Nuclear Bet",
    "VI": "Leading Across Cultures",
    "VII": "Freyssinet",
    "VIII": "Ireland",
    "XII": "How I Work",
    "XIV": "What's Next",
}

AUTHOR_PREFACE = """## Why I'm Telling This Story

I'm not a celebrity, politician, or talking head. I'm a professional from **Chandraghona** in the Chittagong Hill Tracts who — through a government scholarship, learning Russian the hard way, and a lot of deliberate work — ended up directing operations on Bangladesh's first nuclear power plant.

Now, at what looks like the peak of that career, I'm pressing pause. Not to escape. To sharpen. In September 2026 I start an **MSc in Business Analytics** at **ATU Galway**, Ireland.

This page is the longer version of my story. Roles, dates, and skills live on my [portfolio](index.html) — I kept those separate so this doesn't repeat them.
"""

AUTHOR_INTRO = """<p class="bio-lead">This is my story — where I'm from, my family, Rooppur, Ireland, and where I'm headed. For the career timeline, education, and skills breakdown, see my <a href="index.html">portfolio</a>.</p>"""

AUTHOR_DIGITAL = """## Online

I built my online presence on purpose — not as casual social media, but as something people can actually use.

| Platform | What it's for |
|----------|---------------|
| [nbaroi.com](https://nbaroi.com) | Portfolio, this biography, my AI twin |
| [LinkedIn](https://linkedin.com/in/nbaroi) | Professional network |
| [GitHub](https://github.com/NelsonBaroi) | Code and projects |

The **AI twin** on this site isn't a gimmick. I built it to answer questions in my voice when I'm not at the keyboard. [Try the full chat →](chat.html)
"""

AUTHOR_PERSONALITY_SUMMARY = """## How I'd Sum Myself Up

| | |
|---|---|
| **How I talk** | Direct, warm, no-nonsense |
| **How I plan** | Thorough — sometimes too thorough |
| **How I decide** | OODA loop, data first, calculated risks |
| **Work ethic** | Early mornings, long days |
| **Leadership** | Collaborative, but I want results |
| **Learning** | Continuous — structured, applied |
| **Tech** | Tools, not identity |
| **Background** | Many layers; I bridge more than I broadcast |
| **What drives me** | Impact, growth, family |
| **Weak spot** | I over-prepare. I know it. |
"""

AUTHOR_RELATED = """
<section class="section bio-related" id="related">
  <h2>Elsewhere on This Site</h2>
  <p class="bio-related-intro">I split the structured stuff — career, education, skills, projects, philosophy — onto separate pages so nothing gets repeated here.</p>
  <div class="bio-related-grid">
    <a href="index.html#professional-journey" class="bio-related-card">
      <i class="fas fa-briefcase"></i>
      <strong>Career Timeline</strong>
      <span>AMT Engineering &amp; Freyssinet</span>
    </a>
    <a href="index.html#education" class="bio-related-card">
      <i class="fas fa-graduation-cap"></i>
      <strong>Education</strong>
      <span>HSC, BSc Russia, MSc Ireland</span>
    </a>
    <a href="index.html#skills" class="bio-related-card">
      <i class="fas fa-chart-line"></i>
      <strong>Skills</strong>
      <span>Analytics, operations, languages</span>
    </a>
    <a href="projects.html" class="bio-related-card">
      <i class="fas fa-code"></i>
      <strong>Projects</strong>
      <span>AI twin, portfolio builder, research</span>
    </a>
    <a href="philosophy.html" class="bio-related-card">
      <i class="fas fa-lightbulb"></i>
      <strong>Philosophy</strong>
      <span>What I stand for</span>
    </a>
    <a href="courseplan.html" class="bio-related-card">
      <i class="fas fa-book"></i>
      <strong>Learning Plan</strong>
      <span>52-week analytics roadmap</span>
    </a>
  </div>
</section>
"""


def strip_chapter_heading(md: str) -> str:
    md = re.sub(r"^# PREFACE\s*\n+", "", md, flags=re.I | re.MULTILINE)
    md = re.sub(r"^# CHAPTER [IVXLC]+:.*?\n+", "", md, flags=re.I | re.MULTILINE)
    md = re.sub(r"^# APPENDICES\s*\n+", "", md, flags=re.I | re.MULTILINE)
    return md.strip()


def to_first_person(md: str) -> str:
    """Shift third-person prose toward Nelson's first-person voice."""
    rules = [
        (r"This biography is compiled from all available primary sources:.*?as of May 2026\.\s*", ""),
        (r"Nelson Baroi is not a celebrity, nor a politician, nor a public intellectual\. He is something perhaps more interesting —", "I'm not a celebrity, politician, or public intellectual. I'm"),
        (r"a young professional from", "a professional from"),
        (r", he found himself directing", ", I found myself directing"),
        (r"And now, at the peak of that career, he is choosing", "Now, at the peak of that career, I'm choosing"),
        (r"This is a story of ambition without arrogance, of strategic thinking wedded to genuine warmth, and of a man who approaches life with the same methodical precision he brings to managing a \$12\.65 billion construction site\.", "That's the thread through all of this — ambition without arrogance, strategy with warmth, and the same methodical precision I bring to a $12.65 billion construction site."),
        (r"Nelson Baroi was born and raised in", "I was born and raised in"),
        (r"Nelson belongs to the", "I belong to the"),
        (r"To be a Christian from the Chittagong Hill Tracts places Nelson at", "Being a Christian from the Chittagong Hill Tracts puts me at"),
        (r"This context is not incidental to his story\. It explains the quiet resilience that characterises his approach to life, the emphasis he places on merit and education as vehicles for advancement, and his comfort operating as", "That background shaped me — the quiet resilience, the belief that merit and education are how you move, and being comfortable as"),
        (r"Growing up in Chandraghona instilled in Nelson what he describes as the core values that guide his life:", "Growing up in Chandraghona gave me the values I still live by:"),
        (r"His family, by his own account, was supportive", "My family was supportive"),
        (r"what would become Nelson's defining trait:", "what became my defining trait:"),
        (r"The Baroi family represents a modest but upwardly mobile household within Bangladesh's Christian minority community\.", "We're a modest, upwardly mobile family in Bangladesh's Christian minority community."),
        (r"who has played the most significant ongoing role in Nelson's life and career", "who's had the biggest role in my life and career"),
        (r"Suporna is Nelson's primary financial sponsor", "She's my primary sponsor"),
        (r"Nelson is \*\*married\*\*", "I'm **married**"),
        (r"His wife remains in Bangladesh", "My wife is staying in Bangladesh"),
        (r"Nelson's educational path through Notre Dame College", "My path through Notre Dame College"),
        (r"Nelson completed his", "I completed my"),
        (r"Nelson moved to the capital", "I moved to Dhaka"),
        (r"For a student from Chandraghona to gain admission to Notre Dame College represents a significant achievement\. It required not just academic excellence but the courage and family support to leave home at approximately 16 years of age and navigate life in Bangladesh's chaotic capital city\.", "Getting into Notre Dame from Chandraghona was a big deal. It took more than grades — leaving home at sixteen and learning Dhaka on my own."),
        (r"Completing SSC from a school in the Chittagong Hill Tracts — far from the educational powerhouses of Dhaka or Chittagong city — and then securing admission to Notre Dame College speaks to exceptional academic performance at an early age\.", "Finishing SSC in the Hill Tracts — far from Dhaka's feeder schools — and still getting into Notre Dame told me early that merit could open doors."),
        (r"The two years at Notre Dame \(approximately 2009-2011\) would have exposed Nelson to", "Notre Dame (2009–2011) threw me into"),
        (r"clearly resonated with Nelson's own family values and became permanently embedded in his worldview\.", "matched what my family had taught me, and it stuck."),
        (r"Nelson secured a", "I secured a"),
        (r"Nelson enrolled in the", "I enrolled in the"),
        (r"Nelson's undergraduate thesis explored", "My undergraduate thesis explored"),
        (r"In Nelson's own words, this thesis", "That thesis"),
        (r"his later interest in data analytics", "my later interest in data analytics"),
        (r"his decision to pursue an MSc", "my decision to pursue an MSc"),
        (r"Nelson has described himself as", "I've said before — I'm"),
        (r"It means he spent four years:", "For four years I:"),
        (r"By the time Nelson graduated, he was functionally trilingual", "By graduation I was functionally trilingual"),
        (r"Nelson describes this environment vividly:", "I'll put it plainly:"),
        (r"Nelson returned to Bangladesh after completing his studies", "I came back to Bangladesh after Russia"),
        (r"Nelson describes this period with characteristic directness:", "I'll say it directly:"),
        (r"In \*\*February 2024\*\*, after five years of demonstrated competence, Nelson was promoted to", "In **February 2024**, after five years on the ground, I was promoted to"),
        (r"As Director, Nelson oversees:", "As Director, I oversee:"),
        (r"What makes Nelson's role uniquely demanding is the", "What makes my role demanding is the"),
        (r"He manages a workforce", "I manage a workforce"),
        (r"His fluency in Russian — earned through five years of immersion during his degree — is not a CV ornament\. It is a daily operational tool\. Nelson is one of very few Bangladeshi professionals who can", "My Russian — five years of immersion, not a classroom certificate — is a daily tool. I'm one of very few Bangladeshi professionals who can"),
        (r"Alongside his primary role at AMT Engineering JSC, Nelson has contributed to", "Alongside AMT, I've also worked with"),
        (r"Nelson's ability to contribute meaningfully to two organisations simultaneously", "Working across two organisations on the same site"),
        (r"his capacity for managing complexity, his organisational discipline, and his reputation as someone who delivers", "taught me how to manage complexity and deliver without dropping the ball"),
        (r"Nelson applied for and was accepted to", "I applied for and got into"),
        (r"within Nelson's framework", "for me"),
        (r"In his own words:", "Frankly:"),
        (r"He elaborates:", "Here's the thing:"),
        (r"showed him precisely where his analytical ceiling lay, and he is systematically removing it\.", "showed me exactly where my analytical ceiling was. I'm removing it."),
        (r"which aligns precisely with Nelson's needs as an operations director who wants to build models, not just study them\.", "which is what I need — build models, not just study them."),
        (r"Nelson's Irish student visa application \(Type D, long-stay\) represents perhaps the most meticulously documented visa application process ever recorded in AI conversation history\. His preparation included:", "I treated the Ireland visa like a proper project. Preparation:"),
        (r"reveals something fundamental about Nelson's character: he approaches every challenge as a system to be optimised\.", "That's how I handle hard problems — build a system, then work it."),
        (r"Nelson has already mapped his Irish life with the same strategic precision he brings to managing nuclear power plant operations:", "I've already mapped Ireland the same way I map a construction site:"),
        (r"Based on extensive analysis of Nelson's writing, his AI chatbot's personality configuration, and his conversation patterns, a clear personality profile emerges:", "If you've read my writing or talked to my AI twin, you probably already know this. Still, for the record:"),
        (r"Nelson communicates with economy\. He doesn't waste words\. His AI twin is programmed to use", "I don't waste words. My AI twin uses"),
        (r"and this mirrors his actual communication style\. He uses phrases like", "which matches how I actually talk. Phrases like"),
        (r"Nelson is approachable and empathetic, but he won't pad uncomfortable truths", "I'm approachable, but I won't sugarcoat something that isn't working"),
        (r"Nelson questions received wisdom", "I question received wisdom"),
        (r"Nelson is comfortable admitting the boundaries of his knowledge", "I'm fine saying when I don't know"),
        (r"His honesty about uncertainty is a form of intellectual integrity\.", "That honesty matters to me."),
        (r"One of the most revealing details from Nelson's conversation data is his reference to the", "I use the"),
        (r"Nelson applies this framework to personal decisions,", "I run personal decisions through it too —"),
        (r"Nelson applies it to everything from", "I use it for everything from"),
        (r"Nelson is an \*\*obsessive planner\*\*\. The evidence is overwhelming:", "I plan obsessively. Examples:"),
        (r"Nelson's relationship with technology is pragmatic rather than ideological\. He doesn't learn Python because he loves programming — he learns it because", "I'm pragmatic about tech. I didn't learn Python for fun —"),
        (r"He doesn't build chatbots for fun — he builds them because they serve his professional brand strategy\.", "I built the chatbot because it serves my professional brand."),
        (r"Technology is a \*\*tool\*\* in Nelson's hands, not an identity\.", "Technology is a **tool** in my hands, not who I am."),
        (r"Nelson takes \*\*calculated risks\*\*:", "I take **calculated risks**:"),
        (r"He is not a gambler\. He is an investor", "I'm not a gambler. I'm an investor"),
        (r"Nelson carries multiple cultural identities simultaneously:", "I carry multiple identities at once:"),
        (r"He navigates these overlapping identities with apparent ease", "I navigate them without making a performance of any single one"),
        (r"Post-MSc, Nelson has \*\*24 months\*\*", "After the MSc I'll have **24 months**"),
        (r"Nelson's long-term trajectory points toward", "Long term, I'm aiming for"),
        (r"Nelson's visa application stated his intention", "My visa application stated my intention"),
        (r"Nelson Baroi joins AMT Engineering JSC", "I joined AMT Engineering JSC"),
        (r"Nelson promoted to Director", "I was promoted to Director"),
        (r"Nelson maintains a deliberate professional brand", "I built my professional brand deliberately"),
        (r"Nelson's digital presence is deliberately constructed", "I built my online presence deliberately"),
        (r"Nelson's personal website is deployed on", "This site runs on"),
        (r"The website is technically sophisticated for a non-developer", "For someone who isn't a career developer, the stack is fairly serious"),
        (r"The decision to build a self-training AI chatbot that speaks in his voice is a masterclass in personal branding", "Building a self-training AI twin in my own voice was a branding decision"),
        (r"The chatbot doesn't just describe Nelson's technical skills — it IS a demonstration of them\.", "The chatbot doesn't just list my skills — it demonstrates them."),
        (r"Nelson Baroi is not", "I'm not"),
        (r"Nelson's ", "My "),
        (r"Nelson has ", "I've "),
        (r"Nelson had ", "I had "),
        (r"Nelson was ", "I was "),
        (r"Nelson is ", "I'm "),
        (r"Nelson's", "my"),
        (r"\bNelson\b", "I"),
        (r"\bHe manages\b", "I manage"),
        (r"\bHe elaborates\b", "Look —"),
        (r"\bHe is not\b", "This isn't"),
        (r"\bHe is an\b", "I'm an"),
        (r"\bHe is one\b", "I'm one"),
        (r"\bHe is comfortable\b", "I'm comfortable"),
        (r"\bHe is something\b", "I'm something"),
        (r"\bHe is a\b", "I'm a"),
        (r"\bHe is \*\*", "I'm **"),
        (r"\bHe was \*\*", "I was **"),
        (r"\bHe was promoted\b", "I was promoted"),
        (r"\bHe was functionally\b", "I was functionally"),
        (r"\bHe was the\b", "I was the"),
        (r"\bHe was born\b", "I was born"),
        (r"\bHe spent\b", "I spent"),
        (r"\bHe learned\b", "I learned"),
        (r"\bHe navigates\b", "I navigate"),
        (r"\bHe carries\b", "I carry"),
        (r"\bHe takes\b", "I take"),
        (r"\bHe applies\b", "I apply"),
        (r"\bHe approaches\b", "I approach"),
        (r"\bHe doesn't\b", "I don't"),
        (r"\bHe won't\b", "I won't"),
        (r"\bHe questions\b", "I question"),
        (r"\bHe uses\b", "I use"),
        (r"\bHe built\b", "I built"),
        (r"\bHe treats\b", "I treat"),
        (r"\bHis wife\b", "My wife"),
        (r"\bHis family\b", "My family"),
        (r"\bHis fluency\b", "My fluency"),
        (r"\bHis Russian\b", "My Russian"),
        (r"\bHis role\b", "My role"),
        (r"\bHis job\b", "My job"),
        (r"\bHis approach\b", "My approach"),
        (r"\bHis values\b", "My values"),
        (r"\bHis own\b", "my own"),
        (r"\bHis AI twin\b", "My AI twin"),
        (r"\bHis preparation\b", "My preparation"),
        (r"\bHis honesty\b", "My honesty"),
        (r"\bHis writing\b", "My writing"),
        (r"\bHis communication\b", "My communication"),
        (r"\bHis actual\b", "my actual"),
        (r"\bHis knowledge\b", "my knowledge"),
        (r"\bHis professional\b", "My professional"),
        (r"\bHis personal\b", "My personal"),
        (r"\bHis long-term\b", "My long-term"),
        (r"\bHis visa\b", "My visa"),
        (r"\bHis framework\b", "My framework"),
        (r"\bHis needs\b", "My needs"),
        (r"\bHis undergraduate\b", "My undergraduate"),
        (r"\bHis later\b", "My later"),
        (r"\bHis decision\b", "My decision"),
        (r"\bHis trilingual\b", "My trilingual"),
        (r"\bHis ability\b", "My ability"),
        (r"\bHis capacity\b", "My capacity"),
        (r"\bHis reputation\b", "My reputation"),
        (r"\bHis analytical\b", "My analytical"),
        (r"\bHis character\b", "My character"),
        (r"\bHis online\b", "My online"),
        (r"\bHis digital\b", "My digital"),
        (r"\bhis analytical\b", "my analytical"),
        (r"\bhis worldview\b", "my worldview"),
        (r"\bhis life\b", "my life"),
        (r"\bhis career\b", "my career"),
        (r"\bhis story\b", "my story"),
        (r"\bhis working\b", "my working"),
        (r"\bhis professional brand strategy\b", "my professional brand strategy"),
        (r"\bhis voice\b", "my voice"),
        (r"\bhis hands\b", "my hands"),
        (r"\bhis class\b", "my class"),
        (r"\bhis degree\b", "my degree"),
        (r"\bhis class\b", "my class"),
        (r"\bfor him\b", "for me"),
        (r"\bwith him\b", "with me"),
        (r"\bto him\b", "to me"),
        (r"\babout him\b", "about me"),
        (r"\bof him\b", "of me"),
        (r"\bhim precisely\b", "me exactly"),
        (r"\bshowed him\b", "showed me"),
        (r"\bgave him\b", "gave me"),
        (r"\btaught him\b", "taught me"),
        (r"\benabled him\b", "enabled me"),
        (r"\ballowed him\b", "allowed me"),
        (r"\bhelped him\b", "helped me"),
        (r"\binstilled in him\b", "instilled in me"),
        (r"\bexposed him\b", "exposed me"),
        (r"\bplaces him\b", "puts me"),
        (r"\bcharacterises his\b", "shapes my"),
        (r"\bguide his\b", "guide my"),
        (r"\bserve his\b", "serve my"),
        (r"\breflecting his\b", "reflecting my"),
        (r"\bhis development\b", "my development"),
        (r"\bhis upcoming\b", "my upcoming"),
        (r"\bhis studies\b", "my studies"),
        (r"\bhis HSC\b", "my HSC"),
        (r"\bhis hometown\b", "my hometown"),
        (r"\bhis Christian\b", "my Christian"),
        (r"\bhis subsequent\b", "my subsequent"),
        (r"\bhis current role\b", "my current role"),
        (r"\bhis conversation\b", "my conversation"),
        (r"\bhis full-time\b", "my full-time"),
        (r"\bhis employer\b", "my employer"),
        (r"\bhis position\b", "my position"),
        (r"\bhis operational\b", "my operational"),
        (r"\bhis MSc\b", "my MSc"),
        (r"\bhe serves as\b", "I serve as"),
        (r"\bThis is someone who\b", "That's me — someone who"),
        (r"became the intellectual foundation for his subsequent career trajectory and my decision", "became the foundation for my career and my decision"),
        (r"it is the operational foundation of his current role, where he serves", "it's the operational foundation of my role, where I serve"),
        (r"Her savings instruments include.*?disciplined financial planning\.", "She saves carefully — Shonchoypatra, the usual instruments government families trust. My father did the same. We plan long term in my house."),
        (r"This is not merely a financial relationship — it represents a generational investment\. A retired government servant channeling her pension savings into her son's postgraduate education abroad speaks to a family culture that prioritises education as the primary vehicle for social mobility\.", "That's not just money. It's my mother betting her savings on the next generation."),
        (r"The decision to study abroad while married demonstrates the family's collective investment philosophy: individual sacrifice for shared future benefit\.", "Studying abroad while married isn't easy in our context. We chose short-term separation because the long-term payoff is worth it."),
        (r"- Studying entirely in Russian", "- Studied entirely in Russian"),
        (r"- Navigating a culture", "- Navigated a culture with no compatriot support"),
        (r"- Building social relationships", "- Built relationships"),
        (r"- Developing fluency in Russian", "- Learned Russian out of necessity"),
    ]
    for pattern, repl in rules:
        md = re.sub(pattern, repl, md, flags=re.IGNORECASE)
    # Remaining possessive his/his -> my (word-boundary safe)
    md = re.sub(r"\bHis\b", "My", md)
    md = re.sub(r"\bhis\b", "my", md)
    md = re.sub(r"\bHe\b", "I", md)
    md = re.sub(r"\bhe\b", "I", md)
    return md


def polish_grammar(md: str) -> str:
    fixes = [
        (r"I expects\b", "I expect"),
        (r"I chooses\b", "I choose"),
        (r"makes him effective:", "works for me:"),
        (r"represent him professionally", "represent me professionally"),
        (r"Learned Russian out of necessity from a functional necessity rather than academic choice", "Learned Russian because I had to — not from a syllabus"),
        (r"would have been profoundly formative", "was profoundly formative"),
        (r"It is the behaviour of someone who has learned that", "I've learned that"),
        (r"This reveals a fundamentally \*\*strategic mind\*\* — someone who doesn't", "I'm strategic — I don't"),
        (r'Phrases like "Look," "Here\'s the thing," and "Frankly" when making important points\.', 'I say "Look," "Here\'s the thing," and "Frankly" when it matters.'),
        (r"There is a distinctive blend of South Asian warmth and business directness\. I'm approachable, but I won't sugarcoat something that isn't working with excessive politeness\. If something isn't working, I'll say so clearly — but without cruelty\.", "I'm warm, but direct. I won't pad bad news with polite fluff — I'll tell you clearly, without being cruel."),
        (r"became the intellectual foundation for my subsequent career trajectory and my decision", "shaped my career and my decision"),
        (r"and possessed a level of cross-cultural competence", "and picked up cross-cultural competence"),
        (r"This is a remarkable detail\. For four years I:", "For four years I:"),
        (r"## How I Communicate", "### How I talk"),
    ]
    for pattern, repl in fixes:
        md = re.sub(pattern, repl, md)
    return md


def fix_artifacts(md: str) -> str:
    fixes = [
        (r"\bI I\b", "I"),
        (r"\bI'm I'm\b", "I'm"),
        (r"\bIve\b", "I've"),
        (r"\bIm\b", "I'm"),
        (r"\bI m\b", "I'm"),
        (r"Getting into Notre Dame from Chandraghona a significant achievement", "Getting into Notre Dame from Chandraghona was a big deal"),
        (r"for I to\b", "for me to"),
        (r"to I\b", "to me"),
        (r"with I\b", "with me"),
        (r"about I\b", "about me"),
        (r"of I\b", "of me"),
        (r"for I\b", "for me"),
        (r"exposed I to", "exposed me to"),
        (r"instilled in I", "instilled in me"),
        (r"guide I life", "guide my life"),
        (r"characterises I", "shapes my"),
        (r"places I at", "puts me at"),
        (r"## Dual Contribution", "## Alongside AMT"),
        (r"## Communication Style", "## How I Communicate"),
        (r"## Personality and Behavioural Profile", "## How I Work"),
        (r"## PERSONALITY AND BEHAVIOURAL PROFILE", "## How I Work"),
        (r"## The Road Ahead", "## What's Next"),
        (r"## THE ROAD AHEAD", "## What's Next"),
        (r"PERSONALITY AND BEHAVIOURAL PROFILE", "How I Work"),
        (r"NELSON BAROI\s*\n\s*Personality & Behaviour Summary", "How I'd describe myself"),
        (r"January 2019 \| Nelson Baroi joins", "January 2019 \| I joined"),
        (r"February 2024 \| Nelson promoted", "February 2024 \| Promoted"),
        (r"\bMy long-term\b", "my long-term"),
        (r"\bMy target\b", "my target"),
        (r"Navigated a culture with no compatriot support with no compatriot support system", "Navigated a culture with no compatriot support"),
        (r"Getting into Notre Dame from Chandraghona to Notre Dame College represents a significant achievement\.", "Getting into Notre Dame from Chandraghona was a big deal."),
        (r"Whether this materialises or whether Irish opportunities", "Whether I return or Irish opportunities"),
    ]
    for pattern, repl in fixes:
        md = re.sub(pattern, repl, md)
    return md


def prepare_section(md: str, roman: str | None = None) -> str:
    md = strip_chapter_heading(md)
    md = to_first_person(md)
    md = fix_artifacts(md)
    md = polish_grammar(md)
    title = SECTION_TITLES.get(roman or "", "")
    if title:
        md = f"## {title}\n\n{md}"
    return md