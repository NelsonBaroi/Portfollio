"""Generate biography.html from Kira FULL_BIOGRAPHY.md — first-person author voice."""
import re
from pathlib import Path

import markdown

from biography_voice import (
    AUTHOR_DIGITAL,
    AUTHOR_INTRO,
    AUTHOR_PERSONALITY_SUMMARY,
    AUTHOR_PREFACE,
    AUTHOR_RELATED,
    SECTION_TITLES,
    fix_artifacts,
    prepare_section,
    strip_chapter_heading,
    to_first_person,
)

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


def author_html(md: str, roman: str | None = None) -> str:
    if roman:
        md = prepare_section(md, roman)
    else:
        from biography_voice import polish_grammar

        md = strip_chapter_heading(md)
        md = to_first_person(md)
        md = fix_artifacts(md)
        md = polish_grammar(md)
    return md_html(md)


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
    return prepare_section(f"## {SECTION_TITLES['VI']}\n\n{sub}", "VI")


def trim_freyssinet(ch_vii: str) -> str:
    body = strip_chapter_heading(ch_vii)
    body = re.sub(r"^## Dual Contribution\s*\n", "", body)
    parts = [p.strip() for p in body.split("\n\n") if p.strip() and not p.startswith("---")]
    raw = f"## {SECTION_TITLES['VII']}\n\n" + "\n\n".join(parts[:2])
    return prepare_section(raw, "VII")


def build_content(sections: dict[str, str], by_roman: dict[str, str]) -> tuple[str, str]:
    blocks = []
    toc = []

    def add_section(section_id: str, label: str, html_body: str):
        toc.append(f'    <li><a href="#{section_id}">{label}</a></li>')
        blocks.append(f'    <section class="section bio-chapter" id="{section_id}">\n{html_body}\n    </section>')

    # Intro
    toc.append('    <li><a href="#overview">Overview</a></li>')
    blocks.append(f"""
    <section class="section bio-intro" id="overview">
      {AUTHOR_INTRO}
    </section>
""")

    add_section("preface", "My Story", md_html(AUTHOR_PREFACE))

    for roman, sid in [("I", "origins"), ("II", "family"), ("III", "education-foundation"), ("IV", "russia"), ("V", "rooppur")]:
        if roman in by_roman:
            label = SECTION_TITLES.get(roman, nav_label(next(k for k in sections if chapter_roman(k) == roman)))
            add_section(sid, label, author_html(by_roman[roman], roman))

    if "VI" in by_roman:
        trimmed = strip_timeline_and_roles(by_roman["VI"])
        if trimmed:
            add_section(
                "leadership",
                SECTION_TITLES["VI"],
                md_html(trimmed)
                + '<p class="bio-see-also">Full career timeline is on my <a href="index.html#professional-journey">portfolio</a>.</p>',
            )

    if "VII" in by_roman:
        add_section("freyssinet", SECTION_TITLES["VII"], md_html(trim_freyssinet(by_roman["VII"])))

    if "VIII" in by_roman:
        add_section("ireland", SECTION_TITLES["VIII"], author_html(by_roman["VIII"], "VIII"))

    blocks.append(AUTHOR_RELATED)

    if "XII" in by_roman:
        add_section("personality", SECTION_TITLES["XII"], author_html(by_roman["XII"], "XII"))

    if "XIV" in by_roman:
        add_section("future", SECTION_TITLES["XIV"], author_html(by_roman["XIV"], "XIV"))

    add_section("digital", "Online", md_html(AUTHOR_DIGITAL))

    appendices = sections.get("APPENDICES", "")
    rooppur_dates = extract_appendix(appendices, "F")
    if rooppur_dates:
        dates_md = prepare_section(f"## Rooppur — Key Dates\n\n{rooppur_dates}")
        add_section("rooppur-dates", "Rooppur Dates", md_html(dates_md))
    add_section("personality-summary", "In Short", md_html(AUTHOR_PERSONALITY_SUMMARY))

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
  <meta name="description" content="My story — from Chandraghona to Rooppur Nuclear Power Plant and an MSc in Ireland. Written by Nelson Baroi." data-i18n-meta="biography.meta_desc">
  <meta name="keywords" content="Nelson Baroi biography, Rooppur Nuclear Power Plant, AMT Engineering JSC, Chandraghona, Chittagong Hill Tracts, Notre Dame College Dhaka, Kalmyk State University, ATU Galway, Business Analytics">
  <meta name="author" content="Nelson Baroi">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://nbaroi.com/biography.html">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://nbaroi.com/biography.html">
  <meta property="og:title" content="Nelson Baroi — Comprehensive Biography">
  <meta property="og:description" content="My story — from Chandraghona to Bangladesh's first nuclear power plant and an MSc in Ireland. Written by Nelson Baroi.">
  <meta property="og:image" content="https://nbaroi.com/images/profile.jpg">
  <meta property="og:site_name" content="Nelson Baroi Portfolio">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Nelson Baroi — Comprehensive Biography">
  <meta name="twitter:description" content="My story — from Chandraghona to Rooppur Nuclear Power Plant. In my own words.">
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
      <p class="header-subtitle" data-i18n="biography.header_subtitle">My story, in my own words</p>
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