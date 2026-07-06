"""Generate personal.html — password-gated private archive with premium layout."""
import re
from pathlib import Path

import markdown

ROOT = Path(__file__).parent
PRIVATE_MD = ROOT / "personal_private.md"
OUT = ROOT / "personal.html"

BENGALI_NAME = "নেলসন্‌ বাড়ৈ"

SECTION_ICONS = {
    "origins-the-detail": "fa-mountain-sun",
    "family": "fa-heart",
    "education-extended-record": "fa-graduation-cap",
    "rooppur-project-depth": "fa-atom",
    "career-behind-the-titles": "fa-briefcase",
    "ireland-visa-money-and-plans": "fa-flag",
    "technical-learning-full-picture": "fa-code",
    "projects-notes-not-on-the-public-showcase": "fa-folder-tree",
    "how-i-work": "fa-brain",
    "digital-presence-private-notes": "fa-globe",
    "contact-financial-reference": "fa-id-card",
    "long-term-direction": "fa-compass",
}


def slugify_heading(text: str) -> str:
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[-\s]+", "-", text).strip("-")


def parse_sections(text: str) -> list[tuple[str, str, str]]:
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
    raw = PRIVATE_MD.read_text(encoding="utf-8")
    sections = parse_sections(raw)

    toc_lines = []
    content_blocks = []

    for sid, label, body in sections:
        if sid != "overview":
            short = label.split("—")[0].strip() if "—" in label else label
            if len(short) > 28:
                short = short[:25] + "…"
            toc_lines.append(f'          <li><a href="#{sid}" data-section="{sid}">{short}</a></li>')

        html_body = md_html(body)
        icon = SECTION_ICONS.get(sid, "fa-circle")
        cls = "personal-section overview" if sid == "overview" else "personal-section"
        content_blocks.append(
            f'        <article class="{cls}" id="{sid}" data-section="{sid}">\n'
            f'          <div class="personal-section-head">\n'
            f'            <div class="personal-section-icon"><i class="fas {icon}"></i></div>\n'
            f'            <h2>{label}</h2>\n'
            f'          </div>\n'
            f'          <div class="personal-section-body">\n{html_body}\n          </div>\n'
            f'        </article>'
        )

    toc = "\n".join(toc_lines)
    content = "\n\n".join(content_blocks)

    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title data-i18n="personal.title">Private Archive — {BENGALI_NAME}</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="personal.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
</head>
<body class="personal-page">
  <div class="preloader"><div class="loader"></div></div>

  <div id="personal-login" class="personal-login-screen">
    <div class="personal-login-card">
      <img src="images/profile.jpg" alt="{BENGALI_NAME}" class="personal-login-avatar" width="88" height="88">
      <p class="personal-private-badge"><i class="fas fa-lock"></i> <span data-i18n="personal.badge">Private</span></p>
      <h2 data-i18n="personal.login_title">Private archive</h2>
      <p class="personal-name-bn">{BENGALI_NAME}</p>
      <p class="personal-login-hint" data-i18n="personal.login_hint">Full personal record — not indexed publicly.</p>
      <form id="passwordForm">
        <input type="password" id="password" data-i18n="personal.password_placeholder" placeholder="Password" required autocomplete="current-password" aria-label="Password">
        <button type="submit"><i class="fas fa-arrow-right"></i> <span data-i18n="personal.enter">Enter</span></button>
        <p id="personal-error" data-i18n="personal.error">Incorrect password</p>
      </form>
      <a href="index.html" class="personal-back-link" data-i18n="personal.back_home">← Back to public site</a>
    </div>
  </div>

  <div id="personal-content">
    <div class="lang-switcher">
      <button class="lang-btn active" data-lang="en" onclick="switchLanguage('en')">EN</button>
      <button class="lang-btn" data-lang="ru" onclick="switchLanguage('ru')">RU</button>
      <button class="lang-btn" data-lang="bn" onclick="switchLanguage('bn')">BN</button>
    </div>

    <header class="personal-hero">
      <div class="personal-hero-inner">
        <p class="personal-private-badge"><i class="fas fa-shield-halved"></i> <span data-i18n="personal.badge">Private vault</span></p>
        <img src="images/profile.jpg" alt="{BENGALI_NAME}" class="personal-hero-photo" width="120" height="120">
        <h1 data-i18n="personal.header_title">Private archive</h1>
        <p class="personal-name-bn">{BENGALI_NAME}</p>
        <p class="personal-hero-sub" data-i18n="personal.header_subtitle">Everything not on the public pages — family, visa, finance, depth</p>
      </div>
    </header>

    <div class="personal-stats" aria-label="Key facts">
      <div class="personal-stat">
        <i class="fas fa-atom"></i>
        <strong>Director</strong>
        <span>Rooppur NPP</span>
      </div>
      <div class="personal-stat">
        <i class="fas fa-language"></i>
        <strong>IELTS 6.5</strong>
        <span>English</span>
      </div>
      <div class="personal-stat">
        <i class="fas fa-plane-departure"></i>
        <strong>Sep 2026</strong>
        <span>ATU Galway</span>
      </div>
      <div class="personal-stat">
        <i class="fas fa-comments"></i>
        <strong>3 languages</strong>
        <span>BN · EN · RU</span>
      </div>
    </div>

    <nav class="personal-quick-nav" aria-label="Public site links">
      <a href="index.html"><i class="fas fa-home"></i> <span data-i18n="personal.nav_about">Home</span></a>
      <a href="cv.html"><i class="fas fa-file-alt"></i> <span data-i18n="personal.nav_cv">CV</span></a>
      <a href="biography.html"><i class="fas fa-book-open"></i> <span data-i18n="personal.nav_biography">Background</span></a>
      <a href="projects.html"><i class="fas fa-code"></i> <span data-i18n="personal.nav_projects">Projects</span></a>
      <a href="philosophy.html"><i class="fas fa-lightbulb"></i> <span data-i18n="personal.nav_philosophy">Philosophy</span></a>
      <a href="courses.html"><i class="fas fa-graduation-cap"></i> <span data-i18n="personal.nav_courses">Courses</span></a>
      <a href="courseplan.html"><i class="fas fa-calendar-alt"></i> <span data-i18n="personal.nav_courseplan">Study plan</span></a>
      <a href="https://nbaroi.pythonanywhere.com/" target="_blank" rel="noopener"><i class="fas fa-folder"></i> <span data-i18n="personal.nav_files">Files</span></a>
      <a href="chat.html"><i class="fas fa-comment-dots"></i> <span data-i18n="personal.nav_chat">Chat</span></a>
    </nav>

    <div class="personal-layout">
      <nav class="personal-toc" aria-label="Sections">
        <h2 data-i18n="personal.toc_title">Sections</h2>
        <ul>
{toc}
        </ul>
      </nav>
      <main class="personal-main">
{content}
      </main>
    </div>

    <footer class="personal-footer">
      <div class="social-icons">
        <a href="https://www.linkedin.com/in/nbaroi" target="_blank" rel="noopener" title="LinkedIn"><i class="fab fa-linkedin"></i></a>
        <a href="https://www.facebook.com/noel.baroi" target="_blank" rel="noopener" title="Facebook"><i class="fab fa-facebook"></i></a>
        <a href="https://www.instagram.com/noel0007000" target="_blank" rel="noopener" title="Instagram"><i class="fab fa-instagram"></i></a>
        <a href="mailto:nelson6114007@gmail.com" title="Email"><i class="fas fa-envelope"></i></a>
      </div>
      <p data-i18n="personal.footer_rights">© 2026 <span class="personal-name-bn">{BENGALI_NAME}</span> — private section</p>
    </footer>
  </div>

  <script src="i18n.js" defer></script>
  <script>
    (function() {{
      var form = document.getElementById("passwordForm");
      if (!form) return;
      form.addEventListener("submit", function(e) {{
        e.preventDefault();
        var pw = document.getElementById("password").value;
        if (pw === "nbaroi") {{
          document.getElementById("personal-login").style.display = "none";
          document.getElementById("personal-content").style.display = "block";
          document.querySelector(".preloader")?.remove();
          initScrollSpy();
        }} else {{
          document.getElementById("personal-error").style.display = "block";
        }}
      }});
    }})();

    function initScrollSpy() {{
      var links = document.querySelectorAll(".personal-toc a[data-section]");
      var sections = document.querySelectorAll(".personal-section[data-section]");
      if (!links.length || !sections.length) return;

      var observer = new IntersectionObserver(function(entries) {{
        entries.forEach(function(entry) {{
          if (entry.isIntersecting) {{
            var id = entry.target.getAttribute("data-section");
            links.forEach(function(a) {{
              a.classList.toggle("active", a.getAttribute("data-section") === id);
            }});
          }}
        }});
      }}, {{ rootMargin: "-20% 0px -60% 0px", threshold: 0 }});

      sections.forEach(function(s) {{ observer.observe(s); }});
    }}
  </script>
</body>
</html>
"""

    OUT.write_text(page, encoding="utf-8")
    print(f"Generated {OUT} ({len(sections)} sections)")


if __name__ == "__main__":
    build_page()