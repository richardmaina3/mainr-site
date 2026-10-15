# MainR Site — Product Requirements

**Version:** 0.1 · **Status:** Draft for review · **Date:** 2026-10-05

## 1. Purpose

- **Who is this for?**
  - **Primary:** recruiters and hiring managers, mostly from the embedded/platform world. They often skim for under a minute.
  - **Secondary:** entrepreneurs, innovators and business connections, and people in tech who care about things beyond tech.
- **What problem does it solve?** A résumé lists what Richard did. It does not show how he thinks or why he is a good fit for messy, cross-disciplinary problems. The site is a landing page that gets one idea across: *"This guy could solve my problem."*
- **What does it do?** A single-page, static personal site for Richard Maina, an adaptive problem solver with an embedded/kernel core, shipped-software experience and real-life interests (cooking, music, art, sport). It leads with how he works and keeps all the personality out of the way of scannability.

The site is **not a résumé**. It discusses achievements without reproducing exact résumé detail (dates, bullet-level metrics). The one exception, added 2026-10-13 at Richard's request, is the `resume.exe` window opened by the hero's Resume button: it shows the Experience, Projects and Education sections verbatim.

## 2. Goal type & rigor

**MVP.** A functional, polished v1 with real content, built to be maintained and updated over time. The detail level is moderate and testing is lightweight but has real gating checks (see Engineering Design §11).

## 3. User flows

### Flow 1 — Recruiter skim (the flow that matters most)
1. Lands on the page and sees the header (coordinate readout, nav box with `Work · Cooking · Culture` links, **Contact me** pill).
2. Reads the hero: the eyebrow `HI, I AM RICHARD MAINA`, the headline and a one-sentence subline. A portrait polaroid, an "About me" sticky note and three pixel stickers give personality without competing with the text.
3. Clicks **Resume**, which opens a modal `resume.exe` window with the Experience, Projects and Education sections (close with the X, Escape, a click outside or Back; `/#resume` opens it directly).
4. Reads the **lead paragraph**: two or three sentences on the method (name the limiting constraint, design inside it) and the multidisciplinary direction.
5. Scans the three blocks, each opening with a bold one-line anchor:
   - **Embedded:** Qualcomm IPC and diagnostics, a Linux kernel contribution.
   - **Delivery:** idea to release, covering specs, sprints, stakeholders, timelines and design decisions.
   - **Learning:** ESP32, another Zephyr contribution in progress, curiosity about on-device ML, plus a pointer to cooking and culture. (A first Zephyr contribution has merged and is named under Embedded.)
6. Glances at the `skills.exe` word cloud for a one-look skills scan.
7. Optionally scrolls to Cooking and Culture, then clicks **Contact me** (`mailto:`) from the nav or the hero at any point.

### Flow 2 — Entrepreneur or business connection
1. Lands on the hero and takes in the "multifaceted" framing.
2. Reads the Work lead and the **Delivery** block, where the MOTH and problem-first story lives.
3. Browses Cooking and Culture to get a sense of the person, then contacts via **Contact me**.

### Flow 3 — Owner updates media or copy (Richard)
1. **Add or swap a dish photo:** drop the original into `media-originals/` (one flat folder for all photos), run the photo script (warm-grain filter plus sizing), then add or edit one entry in `cooking.json` (image filename, alt text, dish name, note, date). Preview locally.
2. **Update the word cloud:** edit `skills.json` (add, remove or re-weight words). No code change.
3. **Update the "Right now" sticky note, album covers, museum or sports prints:** edit `culture.json` the same way.
4. **Edit headline, lead, block copy or contact email:** edit `site.json` / `work.json`.
5. Commit and push. Netlify builds and deploys. A bad entry (missing alt text, missing image) fails the build with a clear message instead of publishing silently.

### Flow 4 — Mobile visitor
1. The same content stacks in the same order: hero text first, then the scrapbook corner. Work columns stack, the cooking grid becomes one column with each dish annotation as a caption beneath its polaroid, and the culture collage becomes a one- or two-column stack of the same taped prints.

## 4. Phase 1 (MVP) requirements

**Content and structure (all from the design brief, unchanged in layout)**
- Single scrolling page in this order: **Header, Hero, Work, Cooking, Culture, Footer.** Section labels in the form `01 / WORK`.
- **Hero:** eyebrow, large Pixelify headline, subline, two pill buttons (Contact me, Resume), portrait polaroid, "About me" sticky note, three round stickers (chip, fish, music note).
- **Work (the primary section):**
  - Hybrid format: a short lead paragraph, then three blocks titled **Embedded**, **Delivery** and **Learning**, each with a pixel icon (chip, box, bulb), a one-line bold anchor and 1–2 sentences.
  - A retro-window skills cloud: the word cloud sits inside a small old-OS style window (the Y2K accent from the design brief). Its title bar shows a decorative fake filename, `skills.exe`, plus three decorative square window buttons. Nothing is downloaded or run, and the filename is editable in the JSON. The cloud is built from real HTML/CSS text (no canvas, no library). It mixes technical, delivery and soft skills, plus cooking and horology.
  - No claims about unconfirmed facts (parser speedups, Zephyr contribution details).
- **Cooking:** a 3-column ruled grid, 340px cells, 16px outer radius. Cell 1 is the intro (title and a short paragraph on the approach to food). The mockup's "More plates" pill is deferred past v1. There are **5 dish cells**, each with a filtered polaroid, an uppercase handwritten annotation (Architects Daughter, used only here) and a curved hand-drawn arrow. The polaroid side alternates and the rotation varies.
- **Culture:** a loose taped-print collage, deliberately not a grid. It contains **4 album covers** (staggered), **2 museum prints** (with placard captions), **2 sports prints** (with dashed ticket-stub captions) and a **"Right now"** sticky note (Listening / Watching / Visiting). The intro sits at top left.
- **Footer:** copyright line (year computed at build), a **LinkedIn** link (small mono link, URL from `site.json`) and the Streamline Pixel CC BY 4.0 attribution.
- **Contact:** `mailto:` links only (nav pill and hero button). The address is set in `site.json` (`richardmaina3@gmail.com`, provided 2026-10-11).

**Editability (a core requirement of this build)**
- All copy, captions, alt text, the word cloud and the "Right now" note come from **JSON content files** validated at build time.
- A **photo filter script** applies one shared warm-grain treatment to every photo at build time (not a runtime filter) and outputs web-ready files.
- Adding or swapping media never requires editing components.

**Quality**
- Static site: minimal JavaScript (v1 has only the mobile menu close and the live coordinate readout), no animation libraries, no word-cloud library.
- Optimized images (WebP/AVIF, sensible dimensions, lazy loading below the fold).
- Hover and focus effects on buttons and links only. `prefers-reduced-motion` respected.
- Real `<a>`/`<button>` elements, alt text on all photos, decorative tape, stickers and arrows hidden from assistive tech, text contrast at least 4.5:1, visible focus styles.
- Light mode only. Responsive as described in the design brief §8.
- Basic metadata: page title, meta description, social share image, favicon.

**Delivery**
- Hosted on Netlify from a Git repo, with deploy previews.

## 5. Explicitly out of scope for Phase 1

- Separate pages (all content is on one scrolling page).
- Blog, case-study pages, project write-ups.
- Contact form or any backend. Contact is `mailto:` only.
- CMS or admin UI. Content is edited in JSON files.
- Analytics or tracking.
- Dark mode, scroll animation, parallax, custom cursor.
- Résumé PDF download.
- GitHub link. Deferred until there is more public work to show.
- Multiple languages.
- The "More plates" pill from the mockup, and any gallery or page behind it. v1 shows the five dishes only.

## 6. Open items (do not block the design, but need a decision or content)

| # | Item | Default if unanswered |
|---|---|---|
| 1 | **Hero headline and subline** (the mockup's "Multifaceted by design." is a placeholder) | Draft 2–3 options from the career philosophy doc for Richard to choose from during the content pass |
| 2 | ~~Contact email~~ | **Done 2026-10-11:** set in `site.json`. The build still warns if it ever goes back to the placeholder. |
| 3 | **Photos:** Richard will provide all photos (dishes, album art, portrait, museum, sports) as the build progresses | Placeholder images until each real photo arrives, tracked in the content to-do list |
| 4 | ~~"More plates" pill~~ | **Decided:** out of v1. The pill is not built. |
| 5 | **LinkedIn URL** (LinkedIn link is in v1, GitHub is deferred) | Link omitted from the footer until the URL is provided |
| 6 | **Custom domain** and hosting setup | Netlify default `*.netlify.app` URL until a domain is chosen |
| 7 | **Real Streamline Pixel icons** to replace the mockup's stand-in shapes | Stand-in shapes with the attribution already in place |
| 8 | **Zephyr PR link** | Optional. The first PR has merged (Embedded names Zephyr); Learning says another contribution is in progress |
