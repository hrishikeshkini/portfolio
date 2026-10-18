# AGENTS.md

Static portfolio site — vanilla HTML/CSS/JS, no build step, no package manager, no tests. Deploys to GitHub Pages at `https://hrishikeshkini.github.io/portfolio/` on every push to `main`. One CI workflow exists for blog content refresh (see "CI / Automation" below).

## Structure

- `index.html` — the only landing page: hero with 3D particle logo, about, skills grid, experience timeline, filterable projects grid, blog feed, education, contact.
- `projects/*.html` — 21 self-contained project detail pages. Plain pages (not iframes). Each loads shared assets via relative `../assets/...` paths and contains the project's GitHub / Live Demo links.
- `assets/css/style.css` — entire design system. CSS custom properties; `[data-theme="dark"]` is default, `[data-theme="light"]` overrides via `:root`/attribute selectors.
- `assets/js/main.js` — theme toggle (persisted in `localStorage` key `hk-theme`), nav scroll state + mobile burger, scroll-spy, project filtering, scroll reveals, blog feed renderer, image error fallbacks, footer year.
- `assets/js/logo3d.js` — ES module (`type="module"`), loaded only on `index.html`. Builds a particle "HK" monogram with Three.js; imports `../vendor/three/three.module.js`. Scales particle count down on mobile (2500 vs 6000). Exits silently if WebGL is unavailable or `prefers-reduced-motion` is set. Listens for the `hk-themechange` CustomEvent that `main.js` dispatches on theme toggle to recolor particles.
- `assets/data/blogs.json` — Medium RSS feed snapshot. Rendered client-side by `main.js` via `initBlogs()`. **Do not hardcode blog content in HTML** — edit the JSON or trigger the CI refresh.
- `assets/vendor/three/three.module.js` — vendored Three.js r160. Don't modify.
- `resume.pdf` — served publicly; linked from the Hero and Contact sections with the `download` attribute.

## Gotchas

- **Relative paths only.** The site is served under the `/portfolio/` subpath, so every `href`/`src` must be relative (`assets/...`, `../assets/...`). Absolute paths silently 404 on GitHub Pages.
- Every page (index and project) must keep the inline theme pre-paint `<script>` in `<head>` — it sets `data-theme` from `localStorage` before CSS paints to avoid a flash of the wrong theme.
- `logo3d.js` is an ES module, so the site must be served over HTTP (`file://` breaks module imports).
- When the 3D logo initializes successfully it adds `logo3d-active` to `<body>`, which hides the static `.logo-fallback` monogram in the hero.
- `.thumb-fallback` (gradient placeholder with `data-initials`) is used intentionally where a thumbnail image doesn't exist; `main.js` also swaps it in automatically when a `.project-thumb img` fails to load.
- The footer year is stamped by `main.js` via the `[data-year]` attribute.
- **Project cards are rich**: each card in `index.html` carries the GitHub / Live Demo external links (`.project-links` > `.card-link`) in addition to the write-up link. Keep them in sync when updating `projects/*.html`.

## CI / Automation

`.github/workflows/update-blogs.yml` runs daily:
1. Fetches the Medium RSS feed (`https://medium.com/feed/@hrishikeshkini`).
2. Regenerates `assets/data/blogs.json`.
3. Commits the updated file to `main`, triggering a redeploy.

You don't need to manually refresh blogs.json unless you want to force an immediate sync (run the same Python logic locally).

## Adding a project

1. Create `projects/<name>.html` by copying an existing page (e.g. `projects/mlops.html`) and changing the title, tags, links, and body. Keep the head/nav/footer structure and the theme pre-paint script intact.
2. Add a card to the `.projects-grid` in `index.html` with `data-category` set from: `genai`, `ml`, `mlops`, `data`, `cv` (space-separated for multiple). Include `.project-links` with the GitHub / Live Demo icon buttons.
3. Thumbnail: use `assets/img/project/<name>.jpg`, or a `.thumb-fallback` div with `data-initials` if no image exists.

## Local preview

Serve the repo root with an HTTP server (e.g. `python3 -m http.server`) and open `http://localhost:8000/`. URLs match the relative-path layout but not the `/portfolio/` subpath — that's expected.

## Design conventions

- Fonts: Inter (body), Space Grotesk (display/headings), JetBrains Mono (chips/code) via Google Fonts.
- Accent: blue → violet gradient (`--accent-grad`); use `.gradient-text` for highlighted words in headings.
- Sections use `.section` (padding + z-index) and `.section--soft` (alternating background); cards use `.card` + `.card--hover`; scroll reveals use `.reveal` (+ `.reveal-delay-1..3`).
- Blog cards use `.blog-card` (inside `.blog-grid`), populated by `initBlogs()` in `main.js`.
