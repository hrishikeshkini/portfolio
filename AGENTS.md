# AGENTS.md

## Project Overview

This is the personal portfolio website for Hrishikesh Kini, hosted on GitHub Pages and accessible at `https://imhrishikeshkini.com`.

It is a **static HTML/CSS/JS site** with no build step, bundler, or server-side runtime. All files are deployed as-is to the `main` branch.

## Directory Structure

- `/` (Root): `index.html` (main landing page), `favicon.png`, `CNAME` (custom domain config), and resume PDFs.
- `/projects`: Individual HTML pages for each project listed on the main site. When adding a new project, create a corresponding HTML file here and update the projects section in `index.html`.
- `/assets/css`: Stylesheets. `style.css` handles core styles, design tokens, and fluid responsiveness.
- `/assets/js`: JavaScript files. `main.js` handles global interactions (scrolling, theme toggle, blog feed from Medium, etc.). `cat-follower.js` renders the realistic rigged 3D cat (`assets/models/cat.glb`) in a fixed, pointer-events-none layer: it stands on the hero circle (`data-cat-anchor`), looks at the cursor, and keeps an idle pose on touch or under `prefers-reduced-motion`. Past the hero it simply sits in the bottom-right corner — it does not travel between sections. `fluid-cursor.js` provides the 3D card tilt and magnetic buttons (the ember particle trail was removed per `DESIGN_SPEC.md`).
- `/assets/models`: the rigged cat model, `cat.glb`. Credit: "Toon Cat FREE" by Omabuarts Studio (Sketchfab), CC-BY-4.0 — the footer carries the attribution.
- `/assets/vendor`: Third-party libraries (Bootstrap, jQuery, etc.). Do not modify files here directly. Includes the vendored `three` r160 (`three.module.js`) plus the `three/examples` modules the 3D cat needs (`GLTFLoader`, `BufferGeometryUtils`, `RoomEnvironment`), with their `three` imports rewritten to the local bundle path so the site stays buildless.

## Implementation & Deployment

- **Local Development**: Open `index.html` directly in a web browser. If using a local server, run it from the root directory.
- **Deployment**: Automatic. GitHub Pages serves the `main` branch directly.
- **Domain**: The site uses a custom domain (`imhrishikeshkini.com`) configured via the `CNAME` file and GitHub Pages settings.
- **Content Updates**: 
  - Bio, experience, and skills are hardcoded directly in `index.html`.
  - Blog posts are dynamically fetched from Medium via the `assets/data/blogs.json` configuration.
  - To update the resume, replace the PDF file in the root directory and ensure the link in `index.html` points to the correct filename.

## Conventions

- Keep all code self-contained. Avoid introducing complex build tooling (like Webpack or React) unless explicitly requested, as this project is optimized for simplicity and GitHub Pages static hosting.
- Ensure new project pages follow the layout and style of existing files in `/projects` for visual consistency.
