"""Generate biography.html from curated public markdown — recruiter-safe, human voice."""
import re
from pathlib import Path

import markdown

ROOT = Path(__file__).parent
BIO_MD = ROOT / "biography_public.md"
OUT = ROOT / "biography.html"


def slugify_heading(text: str) -> str:
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[-\s]+", "-", text).strip("-")


def parse_sections(text: str) -> list[tuple[str, str, str]]:
    """Return list of (id, nav_label, body_markdown)."""
    parts = re.split(r"\n(?=## )", text.strip())
    sections = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if part.startswith("# ") and not part.startswith("## "):
            title = part.split("\n", 1)[0].replace("# ", "").strip()
            body = part.split("\n", 1)[1].strip() if "\n" in part else ""
            sections.append(("overview", title, body))
        elif part.startswith("## "):
            title = part.split("\n", 1)[0].replace("## ", "").strip()
            body = part.split("\n", 1)[1].strip() if "\n" in part else ""
            sections.append((slugify_heading(title), title, body))
    return sections


def md_html(text: str) -> str:
    if not text:
        return ""
    return markdown.markdown(text, extensions=["tables", "fenced_code", "nl2br", "sane_lists"])


def build_page() -> None:
    raw = BIO_MD.read_text(encoding="utf-8")
    sections = parse_sections(raw)

    toc_lines = []
    content_blocks = []

    for sid, label, body in sections:
        if sid != "overview":
            toc_lines.append(f'    <li><a href="#{sid}">{label}</a></li>')
        html_body = md_html(body)
        if sid == "overview":
            content_blocks.append(
                f'    <section class="section bio-chapter bio-overview" id="{sid}">\n'
                f'      <h2>{label}</h2>\n{html_body}\n    </section>'
            )
        else:
            content_blocks.append(
                f'    <section class="section bio-chapter" id="{sid}">\n'
                f'      <h2>{label}</h2>\n{html_body}\n    </section>'
            )

    toc = "\n".join(toc_lines)
    content = "\n\n".join(content_blocks)

    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title data-i18n="biography.title">Background — Nelson Baroi</title>
  <meta name="description" content="Background on Nelson Baroi — Chandraghona to Rooppur Nuclear operations and MSc at ATU Galway. Professional context for recruiters and universities." data-i18n-meta="biography.meta_desc">
  <meta name="author" content="Nelson Baroi">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://nbaroi.com/biography.html">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://nbaroi.com/biography.html">
  <meta property="og:title" content="Background — Nelson Baroi">
  <meta property="og:description" content="Professional background: operations at Rooppur Nuclear Power Plant, education in Bangladesh and Russia, MSc at ATU Galway.">
  <meta property="og:image" content="https://nbaroi.com/images/profile.jpg">
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
    }}
    .lang-btn.active {{ color: #fff; background: rgba(255,127,80,0.7); }}
  </style>
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@graph": [
      {{
        "@type": "BreadcrumbList",
        "itemListElement": [
          {{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://nbaroi.com/"}},
          {{"@type": "ListItem", "position": 2, "name": "Background", "item": "https://nbaroi.com/biography.html"}}
        ]
      }},
      {{
        "@type": "ProfilePage",
        "name": "Nelson Baroi — Background",
        "url": "https://nbaroi.com/biography.html",
        "mainEntity": {{
          "@type": "Person",
          "name": "Nelson Baroi",
          "jobTitle": "Director of Bangladesh Branch, AMT Engineering JSC",
          "url": "https://nbaroi.com",
          "email": "nelson6114007@gmail.com",
          "sameAs": ["https://linkedin.com/in/nbaroi", "https://github.com/NelsonBaroi"]
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
    <a href="index.html" title="Home"><img src="images/profile.jpg" alt="Nelson Baroi" class="profile-image" id="profile-image"></a>
  </div>

  <header class="header">
    <div class="header-content">
      <h1 class="gradient-text" data-i18n="biography.header_title">Background</h1>
      <p class="header-subtitle" data-i18n="biography.header_subtitle">Context for recruiters and universities</p>
    </div>
  </header>

  <div class="bio-layout bio-layout-simple">
    <nav class="bio-toc" aria-label="Sections">
      <h2 data-i18n="biography.toc_title">On this page</h2>
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
        <a href="cv.html" class="cta-button"><i class="fas fa-file-alt"></i> <span data-i18n="biography.nav_cv">CV</span></a>
        <a href="index.html" class="cta-button"><i class="fas fa-home"></i> <span data-i18n="biography.nav_home">Home</span></a>
        <a href="projects.html" class="cta-button"><i class="fas fa-code"></i> <span data-i18n="biography.nav_projects">Projects</span></a>
        <a href="mailto:nelson6114007@gmail.com" class="cta-button"><i class="fas fa-envelope"></i> <span data-i18n="biography.nav_email">Email</span></a>
      </div>
    </div>
  </section>

  <footer class="footer">
    <div class="container">
      <div class="social-icons">
        <a href="https://www.linkedin.com/in/nbaroi" target="_blank" rel="noopener"><i class="fab fa-linkedin"></i></a>
        <a href="mailto:nelson6114007@gmail.com"><i class="fas fa-envelope"></i></a>
      </div>
      <p data-i18n="biography.footer_rights">&copy; 2026 Nelson Baroi</p>
    </div>
  </footer>

  <script src="i18n.js" defer></script>
  <script src="script.js" defer></script>
</body>
</html>
"""

    OUT.write_text(page, encoding="utf-8")
    print(f"Generated {OUT} ({len(sections)} sections)")


if __name__ == "__main__":
    build_page()