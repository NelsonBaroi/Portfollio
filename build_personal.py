"""Generate personal.html from private markdown — password-gated full archive."""
import re
from pathlib import Path

import markdown

ROOT = Path(__file__).parent
PRIVATE_MD = ROOT / "personal_private.md"
OUT = ROOT / "personal.html"


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
            toc_lines.append(f'        <li><a href="#{sid}">{label}</a></li>')
        html_body = md_html(body)
        cls = "section bio-chapter bio-overview" if sid == "overview" else "section bio-chapter"
        content_blocks.append(
            f'      <section class="{cls}" id="{sid}">\n'
            f'        <h2>{label}</h2>\n{html_body}\n      </section>'
        )

    toc = "\n".join(toc_lines)
    content = "\n\n".join(content_blocks)

    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title data-i18n="personal.title">Private Archive — Nelson Baroi</title>
  <meta name="robots" content="noindex, nofollow">
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
    #login-wrap {{
      max-width: 400px; margin: 12vh auto; padding: 2rem;
      background: rgba(255,255,255,0.92); border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12); text-align: center;
    }}
    #login-wrap input {{
      width: 100%; padding: 12px; margin: 12px 0; border: 1px solid #ddd;
      border-radius: 8px; font-size: 1rem; box-sizing: border-box;
    }}
    #login-wrap button {{
      width: 100%; padding: 12px; background: linear-gradient(135deg, #20b2aa, #ff7f50);
      color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
    }}
    #error {{ color: #c0392b; display: none; margin-top: 8px; }}
    #content {{ display: none; }}
    .personal-quick-nav {{
      max-width: 1100px; margin: 0 auto 1rem; padding: 0 1.5rem;
      display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
    }}
    .personal-quick-nav a {{
      font-size: 0.85rem; padding: 8px 14px; border-radius: 8px;
      background: rgba(255,255,255,0.9); color: #333; text-decoration: none;
      border: 1px solid rgba(0,0,0,0.08);
    }}
    .personal-quick-nav a:hover {{ border-color: #ff7f50; color: #ff7f50; }}
    .personal-private-badge {{
      display: inline-block; font-size: 0.75rem; font-weight: 600;
      letter-spacing: 0.05em; text-transform: uppercase;
      background: rgba(255,127,80,0.15); color: #c45a2a;
      padding: 4px 10px; border-radius: 6px; margin-bottom: 8px;
    }}
  </style>
</head>
<body>
  <div class="preloader"><div class="loader"></div></div>

  <div id="login-wrap">
    <p class="personal-private-badge" data-i18n="personal.badge">Private</p>
    <h2 data-i18n="personal.login_title">Login</h2>
    <p style="font-size:0.9rem;color:#666;margin-bottom:1rem" data-i18n="personal.login_hint">Full personal archive — not indexed publicly.</p>
    <form id="passwordForm">
      <input type="password" id="password" data-i18n="personal.password_placeholder" placeholder="Password" required autocomplete="current-password">
      <button type="submit"><span data-i18n="personal.enter">Enter</span></button>
      <p id="error" data-i18n="personal.error">Incorrect password</p>
    </form>
    <p style="margin-top:1.5rem"><a href="index.html" data-i18n="personal.back_home">← Back to public site</a></p>
  </div>

  <div id="content">
    <div class="lang-switcher">
      <button class="lang-btn active" data-lang="en" onclick="switchLanguage('en')">EN</button>
      <button class="lang-btn" data-lang="ru" onclick="switchLanguage('ru')">RU</button>
      <button class="lang-btn" data-lang="bn" onclick="switchLanguage('bn')">BN</button>
    </div>

    <header class="header">
      <div class="header-content">
        <p class="personal-private-badge" data-i18n="personal.badge">Private</p>
        <h1 class="gradient-text" data-i18n="personal.header_title">Private archive</h1>
        <p class="header-subtitle" data-i18n="personal.header_subtitle">Everything not on the public pages</p>
      </div>
    </header>

    <nav class="personal-quick-nav" aria-label="Public site links">
      <a href="index.html"><i class="fas fa-home"></i> <span data-i18n="personal.nav_about">Home</span></a>
      <a href="cv.html"><i class="fas fa-file-alt"></i> <span data-i18n="personal.nav_cv">CV</span></a>
      <a href="biography.html"><i class="fas fa-book-open"></i> <span data-i18n="personal.nav_biography">Background</span></a>
      <a href="projects.html"><i class="fas fa-code"></i> <span data-i18n="personal.nav_projects">Projects</span></a>
      <a href="philosophy.html"><i class="fas fa-lightbulb"></i> <span data-i18n="personal.nav_philosophy">Philosophy</span></a>
      <a href="courses.html"><i class="fas fa-graduation-cap"></i> <span data-i18n="personal.nav_courses">Courses</span></a>
      <a href="https://nbaroi.pythonanywhere.com/" target="_blank" rel="noopener"><i class="fas fa-folder"></i> <span data-i18n="personal.nav_files">File system</span></a>
      <a href="chat.html"><i class="fas fa-comment-dots"></i> <span data-i18n="personal.nav_chat">Chat</span></a>
    </nav>

    <div class="bio-layout bio-layout-simple">
      <nav class="bio-toc" aria-label="Sections">
        <h2 data-i18n="personal.toc_title">On this page</h2>
        <ul>
{toc}
        </ul>
      </nav>
      <main class="bio-main">
{content}
      </main>
    </div>

    <footer class="footer">
      <div class="container">
        <div class="social-icons">
          <a href="https://www.linkedin.com/in/nbaroi" target="_blank" rel="noopener"><i class="fab fa-linkedin"></i></a>
          <a href="mailto:nelson6114007@gmail.com"><i class="fas fa-envelope"></i></a>
        </div>
        <p data-i18n="personal.footer_rights">&copy; 2026 Nelson Baroi — private section</p>
      </div>
    </footer>
  </div>

  <script src="i18n.js" defer></script>
  <script src="script.js" defer></script>
  <script>
    document.getElementById("passwordForm").addEventListener("submit", function(event) {{
      event.preventDefault();
      var password = document.getElementById("password").value;
      if (password === "nbaroi") {{
        document.getElementById("login-wrap").style.display = "none";
        document.getElementById("content").style.display = "block";
        document.querySelector(".preloader")?.remove();
      }} else {{
        document.getElementById("error").style.display = "block";
      }}
    }});
  </script>
</body>
</html>
"""

    OUT.write_text(page, encoding="utf-8")
    print(f"Generated {OUT} ({len(sections)} sections)")


if __name__ == "__main__":
    build_page()