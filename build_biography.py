"""Generate biography.html from Kira FULL_BIOGRAPHY.md — unique narrative only."""
import re
from pathlib import Path

import markdown

ROOT = Path(__file__).parent
BIO_MD = ROOT.parent / "Bot" / "Kira" / "01-biography" / "FULL_BIOGRAPHY.md"
OUT = ROOT / "biography.html"

SECTION_RE = re.compile(
    r"^# (PREFACE|CHAPTER [IVXLC]+:.*?|APPENDICES|COLOPHON)\s*$",
    re.MULTILINE | re.IGNORECASE,
)

ROMAN_SLUGS = {
    "I": "origins",
    "II": "family",
    "III": "education-foundation",
    "IV": "russia",
    "V": "rooppur",
    "VI": "leadership",
    "VII": "freyssinet",
    "VIII": "ireland",
    "IX": "skills",
    "X": "projects",
    "XI": "philosophy",
    "XII": "personality",
    "XIII": "digital",
    "XIV": "future",
}


def slugify(title: str) -> str:
    upper = title.upper().strip()
    if upper == "PREFACE":
        return "preface"
    if upper == "APPENDICES":
        return "appendices"
    match = re.match(r"CHAPTER\s+([IVXLC]+)", title, re.I)
    if match:
        return ROMAN_SLUGS.get(match.group(1).upper(), "section")
    return "section"


def nav_label(title: str) -> str:
    if title.upper() == "PREFACE":
        return "Preface"
    title = re.sub(r"^CHAPTER\s+[IVXLC]+:\s*", "", title, flags=re.I).strip()
    if title.isupper():
        title = title.title()
        for a, b in [("Msc", "MSc"), ("Jsc", "JSC"), ("Amt", "AMT"), ("Ssc", "SSC"), ("Hsc", "HSC"), ("Cht", "CHT")]:
            title = title.replace(a, b)
    return title[:36] + ("…" if len(title) > 36 else "")


def chapter_roman(title: str) -> str | None:
    match = re.match(r"CHAPTER\s+([IVXLC]+)\s*:", title, re.I)
    return match.group(1).upper() if match else None


def parse_sections(text: str) -> tuple[dict[str, str], dict[str, str]]:
    matches = list(SECTION_RE.finditer(text))
    sections: dict[str, str] = {}
    by_roman: dict[str, str] = {}
    for i, match in enumerate(matches):
        title = match.group(1).strip()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[match.start() : end].strip()
        sections[title] = body
        roman = chapter_roman(title)
        if roman:
            by_roman[roman] = body
    return sections, by_roman


def md_html(text: str) -> str:
    text = re.sub(r"^---\s*\n", "", text)
    return markdown.markdown(text, extensions=["tables", "fenced_code", "nl2br", "sane_lists"])


def extract_subsection(body: str, heading: str) -> str:
    pattern = rf"## {re.escape(heading)}\s*\n(.*?)(?=\n## |\Z)"
    match = re.search(pattern, body, re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else ""


def extract_appendix(body: str, letter: str) -> str:
    pattern = rf"## Appendix {letter}:.*?\n(.*?)(?=\n## Appendix |\Z)"
    match = re.search(pattern, body, re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else ""


def strip_timeline_and_roles(ch_vi: str) -> str:
    """Keep only cross-cultural leadership — career timeline lives on index."""
    sub = extract_subsection(ch_vi, "The Cross-Cultural Leadership Challenge")
    if not sub:
        return ""
    return f"## Cross-Cultural Leadership at Rooppur\n\n{sub}"


def trim_freyssinet(ch_vii: str) -> str:
    body = re.sub(r"^# CHAPTER VII:.*?\n", "", ch_vii, flags=re.I)
    body = re.sub(r"^## Dual Contribution\s*\n", "", body)
    parts = [p.strip() for p in body.split("\n\n") if p.strip() and not p.startswith("---")]
    return "\n\n".join(parts[:2])


def digital_condensed() -> str:
    return """## Digital Presence

Nelson maintains a deliberate professional brand online — not casual social media, but a structured presence built for credibility and accessibility.

| Platform | Purpose |
|----------|---------|
| [nbaroi.com](https://nbaroi.com) | Portfolio, biography, AI twin |
| [LinkedIn](https://linkedin.com/in/nbaroi) | Professional networking |
| [GitHub](https://github.com/NelsonBaroi) | Code and open projects |

The **AI twin** on this site is itself a brand demonstration — a self-training chatbot that speaks in Nelson's voice, answers questions 24/7, and showcases technical capability through its existence. [Try the full chat →](chat.html)"""


def related_callout() -> str:
    return """
<section class="section bio-related" id="related">
  <h2>Quick Reference on This Site</h2>
  <p class="bio-related-intro">Career timeline, education, skills, projects, and philosophy are kept on dedicated pages to avoid repetition. Use these for the structured overview:</p>
  <div class="bio-related-grid">
    <a href="index.html#professional-journey" class="bio-related-card">
      <i class="fas fa-briefcase"></i>
      <strong>Career Timeline</strong>
      <span>AMT Engineering &amp; Freyssinet roles</span>
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
      <span>Eight guiding principles</span>
    </a>
    <a href="courseplan.html" class="bio-related-card">
      <i class="fas fa-book"></i>
      <strong>Learning Plan</strong>
      <span>52-week analytics roadmap</span>
    </a>
  </div>
</section>
"""


def build_content(sections: dict[str, str], by_roman: dict[str, str]) -> tuple[str, str]:
    blocks = []
    toc = []

    def add_section(section_id: str, label: str, html_body: str):
        toc.append(f'    <li><a href="#{section_id}">{label}</a></li>')
        blocks.append(f'    <section class="section bio-chapter" id="{section_id}">\n{html_body}\n    </section>')

    # Intro
    toc.append('    <li><a href="#overview">Overview</a></li>')
    blocks.append("""
    <section class="section bio-intro" id="overview">
      <p class="bio-lead">A narrative biography — origins, family, the Rooppur nuclear project, Ireland plans, and the road ahead. For career roles, education timeline, and skills, see the <a href="index.html">main portfolio</a>.</p>
    </section>
""")

    add_section("preface", "Preface", md_html(sections.get("PREFACE", "")))

    for roman, sid in [("I", "origins"), ("II", "family"), ("III", "education-foundation"), ("IV", "russia"), ("V", "rooppur")]:
        if roman in by_roman:
            title = next(k for k in sections if chapter_roman(k) == roman)
            add_section(sid, nav_label(title), md_html(by_roman[roman]))

    if "VI" in by_roman:
        trimmed = strip_timeline_and_roles(by_roman["VI"])
        if trimmed:
            add_section(
                "leadership",
                "Cross-Cultural Leadership",
                md_html(trimmed)
                + '<p class="bio-see-also">Full career timeline: <a href="index.html#professional-journey">Professional Journey</a> on the portfolio.</p>',
            )

    if "VII" in by_roman:
        add_section("freyssinet", "Freyssinet", md_html(trim_freyssinet(by_roman["VII"])))

    if "VIII" in by_roman:
        title = next(k for k in sections if chapter_roman(k) == "VIII")
        add_section("ireland", nav_label(title), md_html(by_roman["VIII"]))

    blocks.append(related_callout())

    if "XII" in by_roman:
        title = next(k for k in sections if chapter_roman(k) == "XII")
        add_section("personality", nav_label(title), md_html(by_roman["XII"]))

    if "XIV" in by_roman:
        title = next(k for k in sections if chapter_roman(k) == "XIV")
        add_section("future", nav_label(title), md_html(by_roman["XIV"]))

    add_section("digital", "Digital Presence", md_html(digital_condensed()))

    appendices = sections.get("APPENDICES", "")
    rooppur_dates = extract_appendix(appendices, "F")
    personality = extract_appendix(appendices, "H")
    if rooppur_dates:
        add_section("rooppur-dates", "Rooppur Key Dates", md_html(f"## Key Dates\n\n{rooppur_dates}"))
    if personality:
        add_section("personality-summary", "Personality Summary", md_html(f"## Summary Card\n\n{personality}"))

    return "\n".join(toc), "\n\n".join(blocks)


def build_page() -> None:
    if not BIO_MD.exists():
        raise FileNotFoundError(f"Biography source not found: {BIO_MD}")

    sections, by_roman = parse_sections(BIO_MD.read_text(encoding="utf-8"))
    toc, content = build_content(sections, by_roman)

    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title data-i18n="biography.title">Nelson Baroi Biography — Chandraghona to Rooppur Nuclear Plant | nbaroi.com</title>
  <meta name="description" content="Full narrative biography of Nelson Baroi — Christian minority from Chandraghona, Notre Dame College, Russian scholarship, Director at Rooppur Nuclear Power Plant, MSc at ATU Galway Ireland." data-i18n-meta="biography.meta_desc">
  <meta name="keywords" content="Nelson Baroi biography, Rooppur Nuclear Power Plant, AMT Engineering JSC, Chandraghona, Chittagong Hill Tracts, Notre Dame College Dhaka, Kalmyk State University, ATU Galway, Business Analytics">
  <meta name="author" content="Nelson Baroi">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://nbaroi.com/biography.html">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://nbaroi.com/biography.html">
  <meta property="og:title" content="Nelson Baroi — Comprehensive Biography">
  <meta property="og:description" content="From Chandraghona to Bangladesh's first nuclear power plant and an MSc in Ireland — the full story of Nelson Baroi.">
  <meta property="og:image" content="https://nbaroi.com/images/profile.jpg">
  <meta property="og:site_name" content="Nelson Baroi Portfolio">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Nelson Baroi — Comprehensive Biography">
  <meta name="twitter:description" content="From Chandraghona to Rooppur Nuclear Power Plant — Nelson Baroi's full narrative biography.">
  <meta name="twitter:image" content="https://nbaroi.com/images/profile.jpg">
  <link rel="stylesheet" href="styles.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <style>
    .lang-switcher {{
      position: fixed; top: 16px; right: 16px; z-index: 10001;
      display: flex; gap: 4px;
      background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
      padding: 4px; border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.2);
    }}
    .lang-btn {{
      background: transparent; border: none; color: rgba(255,255,255,0.6);
      padding: 4px 10px; border-radius: 6px; cursor: pointer;
      font-size: 0.78rem; font-weight: 600; font-family: 'Segoe UI', sans-serif;
      transition: all 0.2s;
    }}
    .lang-btn:hover {{ color: #fff; background: rgba(255,255,255,0.15); }}
    .lang-btn.active {{ color: #fff; background: rgba(255,127,80,0.7); }}
    .lang-btn.active:hover {{ background: rgba(255,127,80,0.9); }}
  </style>
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@graph": [
      {{
        "@type": "BreadcrumbList",
        "itemListElement": [
          {{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://nbaroi.com/"}},
          {{"@type": "ListItem", "position": 2, "name": "Biography", "item": "https://nbaroi.com/biography.html"}}
        ]
      }},
      {{
        "@type": "ProfilePage",
        "name": "Nelson Baroi Biography",
        "description": "Comprehensive narrative biography of Nelson Baroi",
        "url": "https://nbaroi.com/biography.html",
        "mainEntity": {{
          "@type": "Person",
          "name": "Nelson Baroi",
          "jobTitle": "Director of Bangladesh Branch, AMT Engineering JSC",
          "url": "https://nbaroi.com",
          "image": "https://nbaroi.com/images/profile.jpg",
          "email": "nelson6114007@gmail.com",
          "telephone": "+8801786068822",
          "nationality": "Bangladeshi",
          "knowsLanguage": ["Bengali", "English", "Russian"],
          "alumniOf": [
            {{"@type": "CollegeOrUniversity", "name": "Notre Dame College, Dhaka"}},
            {{"@type": "CollegeOrUniversity", "name": "Kalmyk State University"}},
            {{"@type": "CollegeOrUniversity", "name": "Atlantic Technological University, Galway"}}
          ],
          "worksFor": {{"@type": "Organization", "name": "AMT Engineering JSC"}},
          "sameAs": [
            "https://linkedin.com/in/nbaroi",
            "https://github.com/NelsonBaroi"
          ]
        }}
      }}
    ]
  }}
  </script>
</head>
<body>
  <div class="preloader"><div class="loader"></div></div>

  <div class="lang-switcher">
    <button class="lang-btn active" data-lang="en" onclick="switchLanguage('en')">EN</button>
    <button class="lang-btn" data-lang="ru" onclick="switchLanguage('ru')">RU</button>
    <button class="lang-btn" data-lang="bn" onclick="switchLanguage('bn')">BN</button>
  </div>

  <div class="profile-container">
    <a href="index.html" title="Back to portfolio"><img src="images/profile.jpg" alt="Nelson Baroi" class="profile-image" id="profile-image"></a>
  </div>

  <header class="header">
    <div class="header-content">
      <h1 class="gradient-text" data-i18n="biography.header_title">Biography</h1>
      <p class="header-subtitle" data-i18n="biography.header_subtitle">From Chandraghona to the World's 33rd Nuclear Nation</p>
    </div>
  </header>

  <div class="bio-layout">
    <nav class="bio-toc" aria-label="Biography chapters">
      <h2 data-i18n="biography.toc_title">Chapters</h2>
      <ul>
{toc}
      </ul>
    </nav>

    <main class="bio-main">
{content}
    </main>
  </div>

  <section class="hero">
    <div class="hero-content">
      <div class="button-container">
        <a href="index.html" class="cta-button"><i class="fas fa-home"></i> <span data-i18n="biography.nav_home">Portfolio</span></a>
        <a href="cv.html" class="cta-button"><i class="fas fa-file-alt"></i> <span data-i18n="biography.nav_cv">CV</span></a>
        <a href="projects.html" class="cta-button"><i class="fas fa-code"></i> <span data-i18n="biography.nav_projects">Projects</span></a>
        <a href="chat.html" class="cta-button cta-chat"><i class="fas fa-comment-dots"></i> <span data-i18n="biography.nav_chat">Chat</span></a>
      </div>
    </div>
  </section>

  <footer class="footer">
    <div class="container">
      <div class="social-icons">
        <a href="https://www.linkedin.com/in/nbaroi" target="_blank" rel="noopener" title="LinkedIn"><i class="fab fa-linkedin"></i></a>
        <a href="https://www.facebook.com/noel.baroi" target="_blank" rel="noopener" title="Facebook"><i class="fab fa-facebook"></i></a>
        <a href="https://www.instagram.com/noel0007000" target="_blank" rel="noopener" title="Instagram"><i class="fab fa-instagram"></i></a>
        <a href="mailto:nelson6114007@gmail.com" title="Email"><i class="fas fa-envelope"></i></a>
      </div>
      <p data-i18n="biography.footer_rights">&copy; 2026 Nelson Baroi. All rights reserved.</p>
    </div>
  </footer>

  <script src="i18n.js" defer></script>
  <script src="script.js" defer></script>
</body>
</html>
"""

    OUT.write_text(page, encoding="utf-8")
    print(f"Generated {OUT}")


if __name__ == "__main__":
    build_page()