# MainR Site — Engineering Design Document

**Version:** 0.1
**Status:** Draft
**Date:** 2026-10-05

## 1. Purpose & Goals

### 1.1 Primary Goals
- Ship a fast, static, single-page personal site that matches `mockup-reference.html` (mockup C) and the design brief (`MAINR_ DESIGN.md`, v1.0).
- Make the site cheap to update. Copy, captions, the word cloud and all media change by editing JSON and dropping in photos, never by editing components.
- Apply one consistent warm, film-grain look to all photos through a build-time script.
- Keep it light: near-zero JavaScript, optimized images, few fonts.
- Fail loudly on bad content (missing alt text, missing image, malformed JSON) at build time rather than publishing it.

### 1.2 Non-Goals
- No CMS, admin UI, database or backend.
- No contact form (`mailto:` links only), no analytics.
- No blog or multi-page routing in v1.
- No client-side framework islands, animation libraries or word-cloud libraries.
- No dark mode.
- No runtime image filtering (grain and warmth are baked into files).

## 2. Tech Stack

| Concern | Choice | Notes |
|---|---|---|
| Site generator | **Astro** (static output) | Components render to plain HTML/CSS at build. No client JS by default. |
| Language | TypeScript (strict) for config, schemas and the script | Components are `.astro` files |
| Styling | Plain CSS with custom properties (design tokens) | Global `tokens.css` + scoped component styles. No Tailwind (the brief's look is token-driven and bespoke). |
| Content | JSON files validated by **Zod** schemas via Astro content collections | `image()` helper validates image references |
| Images | **sharp** (Node) in `scripts/process-photos.mjs`, then Astro's built-in image pipeline (`astro:assets`) for responsive WebP/AVIF at build | Filter script makes masters; Astro makes delivery sizes |
| Fonts | Self-hosted woff2 (latin subset, from Google Fonts, SIL OFL 1.1): Pixelify Sans (500 to 700), DM Sans (400 to 700), DM Mono (400), Architects Daughter (400), `font-display: swap`. The headline and body fonts are preloaded. | Per brief. Only the weights used. Self-hosted for speed (no third-party request) after Lighthouse showed the Google Fonts stylesheet blocking first paint. See `public/fonts/README.txt`. |
| Icons | Streamline Pixel Free (CC BY 4.0) as inline SVG paths in `src/lib/pixelIcons.ts` | Real icons in place since 2026-10-11. The set has no utensil icon, so the Cooking sticker uses the fish (`food-drink-fish`), chosen by Richard. Drawn slightly bolder, at 32px (stickers, Work blocks). The section labels and the header Contact pill carry no icon. |
| Hosting | **Netlify**, deployed from GitHub | `netlify.toml`, deploy previews on branches/PRs |
| Node | Pinned via `.nvmrc` (current LTS) | |
| Quality tooling | `astro check`, Lighthouse, axe (manual or Playwright-driven), a link check | See §11 |

No databases, no API keys and no secrets are needed in v1. The `.env` file will only hold the site URL.

## 3. System Architecture

The site has two phases: an **authoring/build phase** (where all the "smarts" live) and a **runtime phase** that is just static files on a CDN.

```
 AUTHORING (Richard's machine)
 ┌──────────────────────┐   npm run photos    ┌──────────────────────────┐
 │ media-originals/     │ ──────────────────► │ src/assets/photos/       │
 │  one flat folder,    │  sharp: orient,     │  filtered masters (JPEG) │
 │  any photo, any name │  warm tint, grain,  │  one flat folder,        │
 │                      │  resize, strip EXIF │  committed to Git        │
 │ (gitignored)         │                     └────────────┬─────────────┘
 └──────────────────────┘                                  │
 ┌──────────────────────┐                                  │
 │ src/content/*.json   │ (copy, alt text, skills, etc.)   │
 └──────────┬───────────┘                                  │
            │                                              │
            ▼              BUILD (local or Netlify)        ▼
      ┌────────────────────────────────────────────────────────┐
      │ astro build                                            │
      │  1. Zod validates JSON + image refs (fail on error)    │
      │  2. Components render sections → static HTML           │
      │  3. astro:assets → responsive WebP/AVIF + width/height │
      │  4. CSS bundled, minified                              │
      └──────────────────────────┬─────────────────────────────┘
                                 ▼
                         dist/ (static files)
                                 │ git push → Netlify
 RUNTIME                         ▼
   Browser ──► Netlify CDN ──► HTML (CSS inline) + fonts + images
```

**Page composition** (`src/pages/index.astro`):

```
BaseLayout (head, meta, fonts, tokens, grid background)
 ├─ Header        (coord readout · nav box · Contact pill)
 ├─ Hero          (text column · scrapbook corner)
 ├─ Work          (lead · 3 WorkBlocks · RetroWindow → SkillsCloud)
 ├─ ResumeDialog  (modal `<dialog>`: RetroWindow → résumé sections from resume.json; opened by the hero's Resume link or /#resume)
 ├─ Cooking       (intro cell · 5 DishCells in a ruled grid)
 ├─ Culture       (intro · collage: Albums, Museum, Sports, RightNow)
 └─ Footer        (copyright · icon attribution · optional links)
```

## 4. Component Deep-Dive: Content layer

### Responsibilities
Hold all editable text and media references, and reject invalid content at build time.

### Files and schemas (`src/content/`)
Singleton files are single-entry collections. List-style files are arrays of entries with a stable `id`.

| File | Contents |
|---|---|
| `site.json` | `name`, `email`, `eyebrow`, `headline`, `subline`, `ctaPrimary`, `ctaSecondary` (the Resume button), `nav[] {id, label}` (the page sections in order, used for the header links and the `01 / WORK` section labels), `attribution {text, url?}` (the footer's Streamline Pixel CC BY 4.0 credit), `linkedin` (URL, optional until provided), `meta {title, description, ogImage}` |
| `hero.json` | `portrait {image, alt, caption, year, focus?}`, `aboutNote {title, text}`, `stickers[]` (icon names) |
| `work.json` | `lead` (string), `skillsWindowTitle` (the decorative filename in the retro window's title bar, e.g. `skills.exe`) and `blocks[3] {id, icon, title, anchor, body, link?}` for **Embedded**, **Delivery**, **Learning** |
| `skills.json` | `[{label, tier 1–6, font: "sans" \| "pixel", accent: boolean}]` (array order is display order) |
| `cooking.json` | `intro {title, text}` and `dishes[] {id, image, alt, name, note, date, rotate?, side?, focus?}` |
| `culture.json` | `intro {title, text}`, `albums[] {image, alt, artist, album, pos}`, `museum[] {image, alt, artist, title, year?, pos}`, `sports[] {image, alt, event, date, section?, row?, pos}`, `rightNow {title, listening, watching, visiting}` |

Conventions:
- `alt` is **required** on every image entry (schema error if empty).
- `image` is a relative path validated by Astro's `image()` helper. A typo or missing file fails the build.
- `pos` is `{x, y, rotate}` in a 1200px-wide design canvas. It is used only by the desktop collage. On smaller screens the items flow in a stack and `pos` is ignored.
- `tier` maps to font size in CSS (1→18px, 2→22px, 3→26px, 4→32px, 5→40px, 6→48px). Weight follows the tier. Authors never write pixel values.
- Soft limits (build **warnings**, not errors) keep the page scannable. Work block body is longer than about 320 characters, the skills list has more than 30 words, a dish note is longer than about 120 characters.
- While `site.email` is the placeholder, a production build prints a warning.

### Technologies
Astro content collections (`file()` loader), Zod.

## 5. Component Deep-Dive: Photo pipeline

### Responsibilities
Turn Richard's original photos into consistent, web-ready masters with the shared warm, nostalgic, lightly grainy look.

### Behavior (`scripts/process-photos.mjs`, run with `npm run photos`)
- **Input:** `media-originals/<name>.(jpg|jpeg|png|webp)`, one flat folder with no category subfolders. The filter is identical for every photo, so categories live only in the JSON (which entry uses which image). Suggested names such as `dish-shakshuka.jpg` or `album-kind-of-blue.jpg` are for finding things and are not enforced. A folder whose name starts with `_` (e.g. `media-originals/_unused/`) is ignored, so originals that are not on the site can be parked there without being processed.
- **Output:** `src/assets/photos/<name>.jpg`, one flat folder. Names are lowercased and hyphenated (Netlify's filesystem is case-sensitive, Windows' is not). Two originals that map to the same output name stop the run with an error. These are high-quality JPEG masters (about 90), longest edge capped at about 1600px, committed to Git. Astro generates the delivery sizes and AVIF/WebP from them.
- **Steps per image:** apply EXIF orientation, **strip all metadata (including GPS)**, apply a slight contrast and saturation adjustment, composite a warm overlay (around `#C98F4A` at 12–14%, matching the mockup), composite desaturated film grain (around 35% strength), and encode.
- **Incremental:** skips images whose output is newer than both the original and `photo-filter.config.json`, so tuning the look re-processes everything on the next run. `--force` reprocesses everything regardless. Files that are not JPEG, PNG or WebP (for example HEIC) are skipped with a warning.
- **Tunable:** warmth, grain strength and contrast live in `scripts/photo-filter.config.json` so the look can be adjusted in one place and re-applied to all photos.
- **Per-photo adjustments:** EXIF orientation is applied automatically. Anything specific to one photo goes under `adjustments` in the config, keyed by the output name without the extension. These fix the capture and do not change the shared look: `rotate` (90, 180 or 270 degrees clockwise, for sideways files with no EXIF tag such as screenshots), `crop` (`{left, top, width, height}` in pixels of the upright original, applied before resizing and filtering so grain is sized for the final image), `whiteBalance` (`{red, blue}` channel multipliers) and `tameBlues` (0 to 1, quiets blue, cyan and violet-blue colours only, to calm a saturated blue backdrop without touching skin tones). Unknown settings, `rotate` combined with `crop`, or out-of-range values stop the run with an error. The original in `media-originals/` is never modified.
- **Grain strength:** 0.1 (set 2026-10-08 after viewing portraits at high-resolution screen size; the original 0.35 looked noisy on faces).
- **Crops:** the script does not crop. Display crops (square dishes, portrait museum prints, wide sports prints) are done in CSS (`aspect-ratio` plus `object-fit: cover`) with an optional per-image `focus` (e.g., `"50% 30%"`) in JSON.
- **Placeholders:** until real photos exist, neutral placeholder masters are used so the page still builds. They are tracked in the content to-do list.

### Input formats
Originals must be JPEG, PNG or WebP. Converting other formats (e.g., iPhone HEIC) is done by Richard beforehand and is deliberately not built into the script.

## 6. Component Deep-Dive: UI components

### Responsibilities
Render the brief's scrapbook vocabulary once and reuse it. No component hardcodes copy or file paths.

| Component | Role |
|---|---|
| `PillButton` | Primary/secondary pill, 2px ink border, 3px hard shadow, hover and focus treatment (up-left nudge 1px, shadow to 5px, fill to accent deep with light text, about 0.12s). Real `<a>`. |
| `PixelIcon` | Inline SVG pixel icons by name (chip, box, bulb, food, note, envelope, frame, ball). Used on the hero stickers and the Work blocks. |
| `Sticker` | 64px round print with a pixel icon, small hard shadow, rotation. `aria-hidden`. |
| `Tape` | Translucent accent strip. `aria-hidden`, decorative. |
| `Polaroid` | Frame, 10px padding, hard shadow, `No. 0N` / date caption, rotation, optional tape |
| `StickyNote` | `#CFDDEA` note with Pixelify title (About me, Right now) |
| `RetroWindow` | `skills.exe` and `resume.exe` windows with a title bar and three square buttons (`closable` makes the last one a real close button) |
| `ResumeDialog` | Modal `<dialog>` holding the résumé (Experience, Projects, Education from `resume.json`: `windowTitle`, `label`, `sections[] {heading, entries[] {title, subtitle?, lines?, bullets?}}`). A small inline script opens it from the hero's `#resume` link or a direct `/#resume` visit and keeps the history in step (Back, Escape, the close button and a click outside all close it). Headings use `--accent-deep`, role lines `--warm-deep`, DM Sans throughout. Full-screen on phones. |
| `SkillsCloud` | Maps `skills.json` to `<span>`s sized by tier (real text, no canvas) |
| `DishCell` | One cooking cell: polaroid in a lower corner, annotation in the opposite upper corner, arrow SVG. Side alternates by index. |
| `CultureCollage` | Absolute-positioned canvas on desktop from `pos` data. Stacked flow on smaller screens. |
| `AlbumCover`, `MuseumPrint` (placard), `SportsPrint` (ticket stub) | Caption variants inside the collage |
| `Header`, `Footer`, `Hero`, `Work`, `Cooking`, `Culture` | Section assemblies |

### Styling system
- `src/styles/tokens.css` defines every color, spacing and type value from the brief as CSS custom properties (`--paper`, `--grid-line`, `--ink`, `--cell`, `--print`, `--accent`, `--accent-deep`, `--sticky`). Components reference tokens, never raw hex.
- The page background grid is a 16px, 1px-line CSS background (hairlines, not a gradient).
- Accent `#80A1C1` is used only for fills, borders and highlights. Text uses ink or accent deep (`#3E6A98`, about 4.7:1).
- Architects Daughter is scoped to the `DishCell` annotation class only.

### Responsive behavior
| Width | Behavior |
|---|---|
| ≥ 1100px | Desktop design from the mockup. Content width 1200px (1280px viewport with 40px padding), centered. Absolute-positioned scrapbook corner and culture collage. |
| 700–1099px | Tablet: hero and work columns stack, cooking grid becomes 2 columns, culture becomes a 2-column stack of the same prints. |
| < 700px | One column everywhere. Hero text first, then the scrapbook corner. Cooking annotations become captions under each polaroid (arrow dropped). Culture is a simple stack. |

**Smooth scaling across desktop, tablet and mobile.** The three tiers above are the layout changes, but nothing should jump or break between them:
- Type and spacing are fluid (`clamp()`). For example the hero headline scales from about 88px on desktop down to about 44px on small phones, and page padding scales from 40px down to 16px.
- Content is capped at 1200px and centered on very wide screens, with no horizontal page scroll at any width.
- Images, polaroids and cells use `aspect-ratio` and relative widths, so nothing overflows or distorts as the width changes.
- The desktop collage and scrapbook corner switch to stacked flow at the 1100px breakpoint rather than being squeezed. The tablet layout is verified rather than assumed (see §11).
- Scrapbook rotations, tape and hard shadows are kept at every size so the look stays consistent.

The mockup is fixed at 1280px, so the tablet breakpoint is a design decision to be confirmed visually.

## 7. Component Deep-Dive: Build & deploy

### Responsibilities
Produce `dist/` and deploy it.

- **Scripts (`package.json`):** `dev` (Astro dev server), `build` (`astro check && astro build`), `preview`, `photos` (the filter script), `check`.
- **`netlify.toml`:** build command `npm run build`, publish dir `dist`, Node version, long-lived immutable cache headers for hashed assets (`/_astro/*`), basic security headers.
- **Git:** `main` is production. Feature branches get Netlify deploy previews. Originals (`media-originals/`) are gitignored. Filtered masters (`src/assets/photos/`) are committed so Netlify only runs `astro build` and never needs the originals.
- **Domain/DNS:** pending decision (see Product Requirements §6).

## 8. Data Flow: End-to-End

**Representative use case: Richard adds a sixth dish, then a recruiter views the page.**

1. Richard copies `shakshuka.jpg` into `media-originals/`.
2. `npm run photos` runs. sharp orients, strips EXIF, warms, grains and writes `src/assets/photos/shakshuka.jpg`.
3. Richard adds an entry to `cooking.json`: `{ "id": "shakshuka", "image": "../assets/photos/shakshuka.jpg", "alt": "…", "name": "Shakshuka", "note": "…", "date": "Sep 2026" }`.
4. `npm run dev` shows it locally. The grid adds a cell, the polaroid side alternates automatically, and the label is numbered `No. 06`.
5. He commits and pushes. Netlify runs `npm run build`. The Zod schema validates (a missing `alt` or a wrong filename would fail the build here), Astro renders HTML, and `astro:assets` generates responsive AVIF/WebP.
6. Netlify publishes `dist/`.
7. A recruiter's browser requests the page. The CDN returns the static HTML (with the CSS inline), the self-hosted fonts and optimized images, all from one origin. Fonts use `font-display: swap`. Below-the-fold images lazy-load. There is no JavaScript to run.

## 9. Build Phases

**Phase 1 (MVP, everything in the Product Requirements §4)**
1. Scaffold Astro project, tokens, base layout, fonts, background grid.
2. Content schemas and starter JSON with placeholder copy and images.
3. Photo filter script and a first processed batch (dishes and albums, which exist today).
4. Components: header, hero, work (lead, blocks, skills cloud), cooking grid, culture collage, footer.
5. Responsive pass (desktop, tablet, mobile).
6. Real copy, real photos and icons, accessibility and performance pass.
7. Netlify setup and launch.

**Later phases (not planned yet):** a GitHub link once there is more public work to show, the "More plates" pill and gallery, analytics, a custom domain, a résumé download, dedicated pages if the site outgrows one scroll, and a study of the ideal wide-screen scaling (v1 keeps the 1200px content cap; see `project_status.md`, "Post-v1 tasks").

## 10. Directory Structure (Proposed)

```
MainR_site/
├─ CLAUDE.md
├─ Architecture.md
├─ Changelog.md
├─ project_status.md
├─ README.md
├─ package.json
├─ astro.config.mjs
├─ tsconfig.json
├─ netlify.toml
├─ .nvmrc
├─ .npmrc                     # ignore-scripts, exact versions
├─ .gitignore
├─ .env                       # template only: SITE_URL
├─ planning/
│  ├─ product_requirements.md
│  ├─ engineering_design.md
│  └─ reference/              # moved here from the project root
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
   ├─ layouts/
   │  └─ BaseLayout.astro
   ├─ components/
   │  ├─ ui/                  # PillButton, PixelIcon, Sticker, Tape, Polaroid,
   │  │                       # StickyNote, RetroWindow
   │  └─ sections/            # Header, Hero, Work, SkillsCloud, Cooking, DishCell,
   │                          # Culture, CultureCollage, Footer
   └─ pages/
      └─ index.astro
```

## 11. Testing / Bring-up Plan

Scaled for MVP: a short list of real gates, not an exhaustive suite.

| Order | Check | Pass criteria |
|---|---|---|
| 1 | **Content validation** (`astro check` + build) | Build succeeds on the starter content. It *fails* on a deliberately broken entry (missing `alt`, wrong image path). |
| 2 | **Photo script** | A test image comes out oriented, with EXIF/GPS stripped, with the shared warm-grain look. Re-running skips unchanged files. |
| 3 | **Visual match** | At 1280px the page matches `mockup-reference.html` (spacing, type, tokens, rotations, grid). At about 900px and 390px, layouts follow §6. Also checked at 768, 1024 and 1440+ and by dragging the browser width continuously to confirm nothing jumps, overlaps or scrolls horizontally. Checked by eye against the mockup. |
| 4 | **Accessibility** | axe (or Lighthouse a11y) reports no serious issues. Keyboard tab order is sensible with visible focus. All photos have alt text and decorative elements are hidden from assistive tech. Text contrast ≥ 4.5:1 (including accent deep on cream). |
| 5 | **Performance** | Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95. No layout shift from images. Zero or near-zero JS shipped. |
| 6 | **Links & metadata** | `mailto:` opens correctly. Nav anchors scroll to the right sections. Title, description, OG image and favicon are present. |
| 7 | **Reduced motion** | With `prefers-reduced-motion`, hover transitions are disabled. |
| 8 | **Deploy preview** | The Netlify preview matches local. Fonts load. No console errors. |

The Playwright MCP is connected and verified working (it blocks `file:` URLs, so check pages over `localhost`). Visual checks run through it, with manual checks by eye where needed.

## 12. Key Constraints & Assumptions

**Hard boundaries (from the design brief)**
- Light mode only. No gradients (the grid is hairlines). No scroll animation, no custom cursor, no parallax. Hover and focus motion on buttons and links only.
- Accent `#80A1C1` is never used as small text on cream.
- Handwriting font only on the dish annotations.
- Cooking is a ruled cell grid and Culture is a loose collage. They must not share a layout.
- Skills cloud is real HTML/CSS text. No canvas, no library.
- Photo warmth and grain are baked into files at build time, never applied at runtime.
- The "Work" section is the primary section. Personality must never cost recruiter scannability.

**Content rules**
- Do not publish unverified claims (parser speedup numbers, Zephyr contribution details, Edge AI as a project). One Zephyr contribution has merged ("contributed to Zephyr" is fine, with no details); the next is "in progress". Edge AI is framed as curiosity.
- The site discusses achievements, not résumé-level detail.
- Placeholder photos and copy are flagged and tracked until replaced.

**Assumptions**
- Original photos are JPEG/PNG/WebP. Richard handles any format conversion (e.g., HEIC) himself.
- Photo count in v1 matches the mockup: 5 dishes, 4 albums, 2 museum, 2 sports, 1 portrait.
- Fonts are self-hosted (decided 2026-10-11, was Google Fonts per the brief) because the Google Fonts stylesheet blocked first paint and cost about 1.1s of mobile performance in Lighthouse.
- Streamline Pixel icons are CC BY 4.0 and require the footer attribution.
- Album covers should be photos Richard took of his own records (safest for rights).
