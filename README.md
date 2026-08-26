# Portfollio — Nelson Baroi

Public professional portfolio at [nbaroi.com](https://nbaroi.com), built with static HTML, CSS and JavaScript. The existing navy, teal and coral design system is preserved.

## Sections

- **Home** — About me, career, and background
- **Portfolio guide** — published answers and source links; clearly labelled as a fallback while the AI service is unavailable
- **Projects** — Coding and professional projects
- **Courses** — Certifications and learning journey
- **Philosophy** — Personal principles and mindset
- **CV** — Detailed resume

## Tech Stack

- HTML5, CSS3, JavaScript (vanilla)
- Python/lxml for static language-page generation and validation
- Public-profile guide with no conversation collection or autonomous training
- Hosted at [nbaroi.com](https://nbaroi.com)

## Setup

```bash
python -m pip install -r requirements-build.txt
npm run build
npm test
python -m http.server 4173 --directory dist
```

## Publishing and content maintenance

The GitHub Actions workflow validates the site and deploys only the allowlisted `dist/` artifact to GitHub Pages. Root English pages and `translations.json` are the authoring sources. Run the build and commit the regenerated `ru/`, `bn/`, root HTML and sitemap files. Vercel receives prebuilt pages; its AI and training endpoints are disabled.

CV and biography body content remains in English, accurately marked with `lang="en"`. Their localized navigation pages are excluded from search indexing until full translations are approved. Other translated pages have language-specific URLs and reciprocal language annotations.

The previous private archive has been removed from the current source/deployment and preserved outside this checkout. The retired URL contains only a public unavailable notice. Removing current files does **not** erase older Git commits, cached pages, forks or previous deployments. Never commit private originals or backups here.

The `portfolio:action` browser event provides a minimal integration hook for CV downloads, project opens and contact clicks. It does not send, store or count visitor activity. Connect an analytics provider only after the owner approves its configuration and data handling. Search Console and real-user performance measurements still require the owner's account/data.

Do not add unverified outcomes, response-time promises, qualification abbreviations or private examination documents. Keep Freyssinet explicitly described as part-time support through AMT Engineering.

## License

MIT
