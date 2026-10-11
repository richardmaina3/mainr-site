# MainR Site

A static, single-page personal site for Richard Maina: an adaptive problem solver with an embedded/kernel core, shipped-software experience and real-life interests (cooking, music, art, sport). It is a landing page for recruiters (mostly embedded/platform) and business connections, built to get one idea across: *"This guy could solve my problem."* It is **not a résumé**. It discusses achievements without reproducing résumé-level detail. Look and feel: an engineer's notebook page with a scrapbook on it and a Y2K desktop in the margins.

Built with Astro, deployed on Netlify from GitHub (`richardmaina3/mainr-site`, public). All copy, captions and the skills word cloud live in JSON. Photos pass through a build-time warm-grain filter script.

Full design source of truth: `planning/engineering_design.md` (requirements: `planning/product_requirements.md`). Visual source of truth: `planning/reference/mockup-reference.html` (mockup C) and the design brief `planning/reference/MAINR_DESIGN.md`. Where the brief and the mockup differ, the mockup's look wins.

## Current Status
**Phase:** Build phases 1 to 6 done (scaffold, content layer, photo filter, components, responsive pass, icons plus accessibility and performance pass), except Richard's own text pass. Phase 7 (Netlify launch) is next.
**Last completed:** Phase 6 (2026-10-11). Real Streamline Pixel icons (slightly bolder; afterwards the section-label and header-pill icons were removed and the Cooking sticker became the Streamline fish, `food-drink-fish`), a 1200x630 share image (`public/og-image.jpg`) with alt text, and fonts self-hosted in `public/fonts/` with inline CSS. Lighthouse 13.5.0 on the production build: Performance 100, Accessibility 100, Best Practices 100, SEO 100 on both the mobile and desktop profiles (the first run scored Performance 84 because the Google Fonts stylesheet blocked first paint). Own audit: all 86 text elements pass contrast (lowest 5.32:1), keyboard order and focus verified. `npm audit`: 0 vulnerabilities. All 14 photos are real and processed. Only JavaScript: a 235-byte inline script for the mobile menu. Earlier: whole page built, responsive sweep at 17 sizes, grain lowered to 0.1. Full detail in `project_status.md`.
**Next step:** The copy pass is done (hero, About, Work, Culture intro and dish notes were rewritten in Richard's voice on 2026-10-11); only small tweaks he makes himself remain. The favicon decision is postponed and the Contact button wording stays. The contact email is set (`richardmaina3@gmail.com`, 2026-10-11). The local history was rebuilt as one clean commit on 2026-10-11 (no `planning/reference/` in it), and Richard decided to keep the album covers as they are (he knows a public push publishes them). Pushed to GitHub on 2026-10-11 (`origin` = `https://github.com/richardmaina3/mainr-site.git`, `main` at `9416d3c`). Phase 7 continues in Netlify (Richard creates the site from the repo, sets the site name and `SITE_URL`, then Claude verifies the live site): Netlify site, `SITE_URL` environment variable, deploy preview, custom domain later. Dev server: http://localhost:4321 (restart it after changing `content.config.ts` or adding a `<script>`). For larger pieces of work, follow the full feature-dev workflow (Richard's request). Say what will be built before starting.
**Blockers:** None.
**Full history & detail:** see `project_status.md`

Build phases (from engineering_design.md §9):
- [x] 1. Scaffold Astro project, tokens, base layout, fonts, grid background
- [x] 2. Content schemas and starter JSON with placeholder copy and images
- [x] 3. Photo filter script and first processed batch
- [x] 4. Components: header, hero, work, cooking, culture, footer
- [x] 5. Responsive pass (desktop, tablet, mobile)
- [x] 6. Real copy, photos and icons; accessibility and performance pass (the real copy is Richard's own text pass, still open)
- [ ] 7. Netlify setup and launch
- [ ] Post-v1: find the ideal wide-screen scaling (v1 keeps the 1200px cap on purpose). Findings and the proposed split-width approach are in `project_status.md` under "Post-v1 tasks".

## Goals
1. Ship a fast, static single-page site that matches the approved mockup and design brief.
2. Make the site cheap to update: copy, captions, the word cloud and all media change via JSON files and a photo script, never by editing components.
3. Give every photo one consistent warm, film-grain look, baked in at build time.
4. Keep it light: near-zero JavaScript, optimized images, four fonts.
5. Fail loudly on bad content (missing alt text, missing image) at build time.

## Architecture
Two phases: **authoring/build** (all the logic) and **runtime** (static files on a CDN).

| Layer | What it is |
|---|---|
| Content | `src/content/*.json` validated by Zod schemas (Astro content collections). Required `alt` on every image. |
| Photo pipeline | `media-originals/` (gitignored) → `npm run photos` (sharp: orient, strip EXIF/GPS, warm tint, grain) → `src/assets/photos/` masters (committed) → Astro `astro:assets` makes responsive AVIF/WebP at build |
| UI components | Reusable scrapbook pieces in `src/components/ui/` (PillButton, PixelIcon, Sticker, Tape, Polaroid, StickyNote, RetroWindow) and section assemblies in `src/components/sections/` |
| Styling | Plain CSS with design tokens in `src/styles/tokens.css`. No Tailwind. |
| Build & deploy | `astro build` → `dist/` → Netlify from GitHub, deploy previews on branches |

Page order: Header, Hero, Work (`01 / WORK`), Cooking (`02 / COOKING`), Culture (`03 / CULTURE`), Footer.

## Key Design Decisions
Non-negotiable. Do not reverse these quietly.
- **Work is the primary section.** Hybrid format: a short lead paragraph, then three blocks titled **Embedded**, **Delivery**, **Learning** (chip, box, bulb icons), each with a bold one-line anchor, plus the `skills.exe` word-cloud window. Personality must never cost recruiter scannability. See engineering_design.md §4, product_requirements.md §4.
- **No unverified claims.** No parser speedup numbers, no Zephyr contribution details (one Zephyr contribution has merged, so "contributed to Zephyr" is fine; the second is "in progress" and stays in Learning), and on-device ML only as curiosity. Not a résumé: no exact dates or bullet-level metrics.
- **Content lives in JSON, not components.** Adding or swapping media must never need a component edit. Pixel sizes are never written in JSON (skills use tiers 1–6). See §4.
- **Photo look is baked in at build time**, never a runtime filter. Strip all EXIF/GPS metadata. See §5.
- **Light mode only. No gradients** (the page grid is hairlines). No scroll animation, parallax or custom cursor. Hover and focus motion on buttons and links only (nudge 1px up-left, shadow 3px→5px, fill to accent deep, about 0.12s). Respect `prefers-reduced-motion`.
- **Color rules:** use tokens, never raw hex in components. Accent `#80A1C1` is for fills, borders and highlights only, never small text on cream. `#3E6A98` is acceptable for text. Text contrast at least 4.5:1.
- **Handwriting font (Architects Daughter) appears only on the cooking dish annotations**, uppercase.
- **Cooking is a ruled cell grid; Culture is a loose collage.** They must never share a layout.
- **Skills cloud is real HTML/CSS text**: no canvas, no word-cloud library.
- **Static and light:** minimal JavaScript (a small inline script for the mobile menu close and the live coordinate readout, an approved exception), no animation libraries. Four fonts, self-hosted (`public/fonts/`, `src/styles/fonts.css`), `font-display: swap`, only the weights used.
- **Smooth scaling:** fluid type and spacing with `clamp()`, content capped at 1200px, layout shifts at 1100px and 700px, no horizontal scroll at any width. See §6.
- **Out of v1:** separate pages, blog, contact form (mailto only), CMS, analytics, dark mode, résumé PDF, GitHub link, the "More plates" pill. See product_requirements.md §5.

## Directory Structure
Proposed tree. The three reference files are already in `planning/reference/`. Everything else below is built during phase 1.

```
MainR_site/
├─ CLAUDE.md
├─ Architecture.md
├─ Changelog.md
├─ project_status.md
├─ README.md
├─ package.json
├─ package-lock.json
├─ astro.config.mjs
├─ tsconfig.json
├─ netlify.toml
├─ .nvmrc
├─ .npmrc                     # ignore-scripts, exact versions (see dependency policy)
├─ .gitignore
├─ .env                       # gitignored, written by Richard: SITE_URL
├─ .env.example               # committed template
├─ planning/
│  ├─ product_requirements.md
│  ├─ engineering_design.md
│  └─ reference/              # GITIGNORED: exists only on Richard's machine (private; back it up elsewhere)
│     ├─ MAINR_DESIGN.md      # design brief v1.0
│     ├─ mockup-reference.html
│     └─ career-philosophy.md
├─ media-originals/           # gitignored, unfiltered source photos, one flat folder
├─ scripts/
│  ├─ process-photos.mjs
│  └─ photo-filter.config.json
├─ public/
│  ├─ favicon.svg
│  ├─ og-image.jpg
│  └─ robots.txt
└─ src/
   ├─ content.config.ts       # Zod schemas and collections
   ├─ content/
   │  ├─ site.json
   │  ├─ hero.json
   │  ├─ work.json
   │  ├─ skills.json
   │  ├─ cooking.json
   │  └─ culture.json
   ├─ assets/
   │  ├─ photos/              # filtered masters (committed)
   │  └─ icons/               # Streamline Pixel SVGs
   ├─ styles/
   │  ├─ tokens.css
   │  └─ global.css
   ├─ lib/
   │  ├─ pixelIcons.ts        # Streamline Pixel icon paths and names
   │  └─ contentWarnings.ts   # build-time soft-limit warnings
   ├─ layouts/
   │  └─ BaseLayout.astro
   ├─ components/
   │  ├─ ui/                  # PillButton, PixelIcon, Sticker, Tape, Polaroid,
   │  │                       # StickyNote, RetroWindow, SectionLabel,
   │  │                       # AlbumCover, MuseumPrint, SportsPrint
   │  └─ sections/            # Header, Hero, Work, SkillsCloud, Cooking, DishCell,
   │                          # Culture, CultureCollage, Footer
   └─ pages/
      └─ index.astro
```

## Host / Runtime Requirements
- Windows 11 dev machine. **Node.js 24 LTS** (24.19.0, installed natively) pinned in `.nvmrc`. Earlier sites ran Node in Docker, but this project uses native Node.
- Playwright MCP blocks `file:` URLs. Check pages over `localhost` (the dev server or preview).
- Original photos must be JPEG, PNG or WebP. Richard converts anything else (e.g., HEIC) himself.
- Streamline Pixel icons are CC BY 4.0 and require the footer attribution.

## Constraints & Policies
**Security — MUST follow:**
- Always use environment variables for secrets. (v1 needs none. `.env` only holds `SITE_URL`.)
- Never commit `.env` or any file with real credentials.
- **The repo is public.** Never commit unfiltered originals (`media-originals/` is gitignored), photo metadata, or anything private.
- Never enter real credentials or API keys on Richard's behalf.

**Dependency policy (npm supply-chain caution):**
- Keep dependencies minimal. Prefer the platform and Astro built-ins over adding a package.
- **Never run `npm install`, `npm update` or `npx <package>` without asking Richard first.** Say what the package is, why it is needed and what it pulls in.
- Pin exact versions (`save-exact=true`) and commit the lockfile. Install from the lockfile.
- Set `ignore-scripts=true` in `.npmrc` and only allow a script if a package truly needs it.
- Run `npm audit` before launch and review any new package's maintainers and recent releases.

**Code Quality:**
- No per-language skill exists yet for TypeScript or Astro. Match the surrounding code.
- Components never hardcode copy, image paths or raw hex colors.
- Required `alt` on every photo. Decorative tape, stickers and arrows are `aria-hidden`.
- Use real `<a>` and `<button>` elements with visible focus styles.
- Build warnings (not errors) for overlong copy and a placeholder email.

## Build Workflow
**Single-feature workflow.** Build one section or component group at a time, in the build-phase order above. Before starting each one, say what you plan to build. Compare the result with `planning/reference/mockup-reference.html` (over `localhost`, using Playwright) and show Richard before moving on. Run `/update-docs` when each feature is done. Use the frontend-design skill for visual work and feature-dev for the larger pieces (e.g., the culture collage).

## Repository Etiquette
- **Branching:** `main` is production. Feature branches get Netlify deploy previews. (Proposed, confirm before first push.) Local repo initialised on `main` on 2026-10-05. **History rebuilt on 2026-10-11 (Richard's go-ahead):** `main` is now a single commit ("Initial commit: MainR personal site (Astro, static)"), identical in content to the previous tip but without `planning/reference/` in any commit. The earlier commits (tip `74fcf50`) are only in the local reflog, which a push never includes; recover with `git branch recover 74fcf50` if ever needed. Pushed to `origin` (HTTPS; SSH is not set up on this machine, and `gh` supplies the credentials with `git -c credential.helper="!gh auth git-credential" push`). The album covers are in the commit on purpose (Richard is keeping them for now).
- **PR vs direct merge:** TBD.
- **Commit messages:** a short imperative summary line, a blank line, then bullets on what and why, ending with the `Co-Authored-By` attribution line. (Convention used for the first commit; confirm or change.)
- **Pushing:** do not push or create PRs until Richard says so.

## Frequently Used Commands
- `npm run dev` (Astro dev server, http://localhost:4321), `npm run build` (`astro check && astro build`), `npm run preview`, `npm run check`
- `npm run photos` (photo filter): processes `media-originals/` into `src/assets/photos/`. Flags: `-- --force` reprocesses everything.

**Documentation upkeep:** at the end of every step or phase, run `/update-docs` (defined in `.claude/commands/update-docs.md`). It syncs the Current Status section above, `project_status.md`, `Changelog.md` and `Architecture.md` with what actually happened. If the slash command isn't available, read that file and follow its steps by hand.

## Reference Documents
- `planning/product_requirements.md`
- `planning/engineering_design.md`
- `planning/reference/MAINR_DESIGN.md` and `planning/reference/mockup-reference.html` (visual source of truth)
- `planning/reference/career-philosophy.md` (reference for Work copy and the skills cloud)

**`planning/reference/` is gitignored** (decided 2026-10-11): it holds the design brief, the mockup and personal career notes, which stay on Richard's machine only and are never committed or pushed. Because git no longer backs them up, keep a copy elsewhere. A fresh clone will not contain them.
- `Architecture.md`, `Changelog.md`, `project_status.md` (kept current via `/update-docs`)
