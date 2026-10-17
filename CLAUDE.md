# MainR Site

A static, single-page personal site for Richard Maina: an adaptive problem solver with an embedded/kernel core, shipped-software experience and real-life interests (cooking, music, art, sport). It is a landing page for recruiters (mostly embedded/platform) and business connections, built to get one idea across: *"This guy could solve my problem."* It is **not a résumé**. It discusses achievements without reproducing résumé-level detail. The one deliberate exception is the `resume.exe` window (opened by the hero's Resume button, 2026-10-13), which shows the Experience, Projects and Education sections verbatim from `resume.json`; everything else on the page stays general. Look and feel: an engineer's notebook page with a scrapbook on it and a Y2K desktop in the margins.

Built with Astro, deployed on Netlify from GitHub (`richardmaina3/mainr-site`, public for now) and live at https://mainr.biz (also reachable at mainr.netlify.app). All copy, captions and the skills word cloud live in JSON. Photos pass through a build-time warm-grain filter script.

Full design source of truth: `planning/engineering_design.md` (requirements: `planning/product_requirements.md`). Visual source of truth: `planning/reference/mockup-reference.html` (mockup C) and the design brief `planning/reference/MAINR_DESIGN.md`. Where the brief and the mockup differ, the mockup's look wins.

## Current Status
**Phase:** All build phases are done. Phase 7 (Netlify launch) is complete: the site is live at https://mainr.biz (Netlify launch 2026-10-13, custom domain 2026-10-17).
**Last completed:** The custom domain (2026-10-17). `mainr.biz` is a Porkbun domain on Netlify DNS (nameservers set 2026-10-15), primary domain in Netlify, `SITE_URL=https://mainr.biz`, a Let's Encrypt certificate that renews automatically, `http` and `www` redirect to `https://mainr.biz/`, and the canonical and share URLs point at it. Lighthouse on mainr.biz: 99/100/100/100 on both desktop and mobile. Before that: the résumé window (PR #1), the copy pass, live header coordinates, the light-bulb Learning icon and the Netlify launch. `npm audit`: 0 vulnerabilities. Three small inline scripts are the only JavaScript (menu close, coordinate readout, résumé dialog). Full detail in `project_status.md`.
**Next step:** Nothing is required. Optional items for Richard to decide: a visible fallback for visitors with no mail app ("Contact me" is a plain `mailto:`; options are the address as text with a Copy button, or a contact window), the favicon, whether to make the repo private (Netlify keeps deploying through its GitHub App), a redirect from `mainr.netlify.app` to `mainr.biz` (it serves the page, with the canonical pointing at mainr.biz), a README, and the post-v1 wide-screen scaling study. Richard checks the LinkedIn share preview himself. Workflow in use: feature branch, draft PR, Netlify deploy preview, then Richard merges on GitHub (the merge command is blocked for Claude by the permission checker). Dev server: http://localhost:4321 (restart it after changing `content.config.ts` or adding a `<script>`). For larger pieces of work, follow the full feature-dev workflow (Richard's request). Say what will be built before starting.
**Blockers:** None.
**Full history & detail:** see `project_status.md`

Build phases (from engineering_design.md §9):
- [x] 1. Scaffold Astro project, tokens, base layout, fonts, grid background
- [x] 2. Content schemas and starter JSON with placeholder copy and images
- [x] 3. Photo filter script and first processed batch
- [x] 4. Components: header, hero, work, cooking, culture, footer
- [x] 5. Responsive pass (desktop, tablet, mobile)
- [x] 6. Real copy, photos and icons; accessibility and performance pass (the copy pass was done 2026-10-11)
- [x] 7. Netlify setup and launch (live at https://mainr.biz)
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
| UI components | Reusable scrapbook pieces in `src/components/ui/` (PillButton, PixelIcon, Sticker, Tape, Polaroid, StickyNote, RetroWindow, RichText) and section assemblies in `src/components/sections/` |
| Styling | Plain CSS with design tokens in `src/styles/tokens.css`. No Tailwind. |
| Build & deploy | `astro build` → `dist/` → Netlify from GitHub, deploy previews on branches |

Page order: Header, Hero, Work (`01 / WORK`), Cooking (`02 / COOKING`), Culture (`03 / CULTURE`), Footer. The résumé dialog (`ResumeDialog`) sits after the footer, outside `main`, and is opened from the hero.

## Key Design Decisions
Non-negotiable. Do not reverse these quietly.
- **Work is the primary section.** Hybrid format: a short lead paragraph, then three blocks titled **Embedded**, **Delivery**, **Learning** (chip, box, bulb icons), each with a bold one-line anchor, plus the `skills.exe` word-cloud window. Personality must never cost recruiter scannability. See engineering_design.md §4, product_requirements.md §4.
- **No unverified claims.** No parser speedup numbers, no Zephyr contribution details (one Zephyr contribution has merged, so "contributed to Zephyr" is fine; the second is "in progress" and stays in Learning), and on-device ML only as curiosity. Not a résumé: no exact dates or bullet-level metrics, except inside the résumé window.
- **Content lives in JSON, not components.** Adding or swapping media must never need a component edit. Pixel sizes are never written in JSON (skills use tiers 1–6). See §4.
- **Photo look is baked in at build time**, never a runtime filter. Strip all EXIF/GPS metadata. See §5.
- **Light mode only. No gradients** (the page grid is hairlines). No scroll animation, parallax or custom cursor. Hover and focus motion on buttons and links only (nudge 1px up-left, shadow 3px→5px, fill to accent deep, about 0.12s). Respect `prefers-reduced-motion`.
- **Color rules:** use tokens, never raw hex in components. Accent `#80A1C1` is for fills, borders and highlights only, never small text on cream. `#3E6A98` is acceptable for text. Text contrast at least 4.5:1.
- **Handwriting font (Architects Daughter) appears only on the cooking dish annotations**, uppercase.
- **Cooking is a ruled cell grid; Culture is a loose collage.** They must never share a layout.
- **Skills cloud is real HTML/CSS text**: no canvas, no word-cloud library.
- **Static and light:** minimal JavaScript (small inline scripts for the mobile menu close, the live coordinate readout and the résumé dialog, all approved exceptions), no animation libraries. Four fonts, self-hosted (`public/fonts/`, `src/styles/fonts.css`), `font-display: swap`, only the weights used.
- **Smooth scaling:** fluid type and spacing with `clamp()`, content capped at 1200px, layout shifts at 1100px and 700px, no horizontal scroll at any width. See §6.
- **Out of v1:** separate pages, blog, contact form (mailto only), CMS, analytics, dark mode, résumé PDF, GitHub link, the "More plates" pill. See product_requirements.md §5.

## Directory Structure
The current tree. `planning/reference/` is gitignored and exists only on Richard's machine.

```
MainR_site/
├─ CLAUDE.md
├─ Architecture.md
├─ Changelog.md
├─ project_status.md
├─ README.md                  # not written yet (the repo has none)
├─ package.json
├─ package-lock.json
├─ astro.config.mjs
├─ tsconfig.json
├─ netlify.toml
├─ .nvmrc
├─ .npmrc                     # ignore-scripts, exact versions (see dependency policy)
├─ .gitignore
├─ .claude/commands/update-docs.md  # the /update-docs command
├─ .env                       # gitignored, written by Richard: SITE_URL
├─ .env.example               # committed template
├─ planning/
│  ├─ product_requirements.md
│  ├─ engineering_design.md
│  └─ reference/              # GITIGNORED: exists only on Richard's machine (private; back it up elsewhere)
│     ├─ MAINR_DESIGN.md      # design brief v1.0
│     ├─ mockup-reference.html
│     ├─ career-philosophy.md
│     └─ Richard Maina Professional Resume_T.docx  # source for resume.json (has a phone number; never commit)
├─ media-originals/           # gitignored, unfiltered source photos, one flat folder
├─ scripts/
│  ├─ process-photos.mjs
│  └─ photo-filter.config.json
├─ public/
│  ├─ favicon.svg
│  ├─ og-image.jpg
│  ├─ robots.txt
│  └─ fonts/                  # self-hosted woff2 files and the OFL notice
└─ src/
   ├─ content.config.ts       # Zod schemas and collections
   ├─ content/
   │  ├─ site.json
   │  ├─ hero.json
   │  ├─ work.json
   │  ├─ resume.json
   │  ├─ skills.json
   │  ├─ cooking.json
   │  └─ culture.json
   ├─ assets/
   │  ├─ photos/              # filtered masters (committed)
   │  └─ icons/               # Streamline Pixel SVGs
   ├─ styles/
   │  ├─ tokens.css
   │  ├─ fonts.css
   │  └─ global.css
   ├─ lib/
   │  ├─ pixelIcons.ts        # Streamline Pixel icon paths and names
   │  ├─ inlineLinks.ts       # [text](https://…) links inside content text
   │  └─ contentWarnings.ts   # build-time soft-limit warnings
   ├─ layouts/
   │  └─ BaseLayout.astro
   ├─ components/
   │  ├─ ui/                  # PillButton, PixelIcon, Sticker, Tape, Polaroid,
   │  │                       # StickyNote, RetroWindow, RichText, SectionLabel,
   │  │                       # AlbumCover, MuseumPrint, SportsPrint
   │  └─ sections/            # Header, Hero, Work, SkillsCloud, Cooking, DishCell,
   │                          # Culture, CultureCollage, ResumeDialog, Footer
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
- **The repo is public** (Richard may make it private; Netlify keeps deploying either way), so treat everything committed as public. Never commit unfiltered originals (`media-originals/` is gitignored), photo metadata, or anything private.
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
- **Branching:** `main` is production (Netlify deploys it). Work happens on feature branches (`feature/<name>`); a draft pull request gets a Netlify deploy preview (`https://deploy-preview-<n>--mainr.netlify.app`, public, `noindex`). Richard merges on GitHub with **Squash and merge** (the merge command is blocked for Claude by the permission checker, so Claude does not merge). Delete the branch afterwards.
- **History:** `main` was rebuilt as one clean commit on 2026-10-11 (no `planning/reference/` in any commit). The earlier commits (tip `74fcf50`) are only in the local reflog; recover with `git branch recover 74fcf50` if ever needed. The album covers are in the repo on purpose (Richard is keeping them for now).
- **Remote:** `origin` is `https://github.com/richardmaina3/mainr-site.git` over HTTPS (SSH is not set up on this machine). Push with the GitHub CLI's credentials: `git -c credential.helper= -c "credential.helper=!gh auth git-credential" push`.
- **Commit messages:** a short imperative summary line, a blank line, then bullets on what and why, ending with the `Co-Authored-By` attribution line.
- **Pushing:** do not push or create PRs until Richard says so.

## Frequently Used Commands
- `npm run dev` (Astro dev server, http://localhost:4321), `npm run build` (`astro check && astro build`), `npm run preview`, `npm run check`
- `npm run photos` (photo filter): processes `media-originals/` into `src/assets/photos/`. Flags: `-- --force` reprocesses everything.
- `gh pr create --draft`, `gh pr view <n>` (the Netlify bot comments the preview link), `gh pr checks <n>`. Lighthouse is a one-off `npx lighthouse@13.5.0 <url>` run with `CHROME_PATH` set (ask Richard first; nothing is added to `package.json`).

**Documentation upkeep:** at the end of every step or phase, run `/update-docs` (defined in `.claude/commands/update-docs.md`). It syncs the Current Status section above, `project_status.md`, `Changelog.md` and `Architecture.md` with what actually happened. If the slash command isn't available, read that file and follow its steps by hand.

## Reference Documents
- `planning/product_requirements.md`
- `planning/engineering_design.md`
- `planning/reference/MAINR_DESIGN.md` and `planning/reference/mockup-reference.html` (visual source of truth)
- `planning/reference/career-philosophy.md` (reference for Work copy and the skills cloud)

**`planning/reference/` is gitignored** (decided 2026-10-11): it holds the design brief, the mockup and personal career notes, which stay on Richard's machine only and are never committed or pushed. Because git no longer backs them up, keep a copy elsewhere. A fresh clone will not contain them.
- `Architecture.md`, `Changelog.md`, `project_status.md` (kept current via `/update-docs`)
