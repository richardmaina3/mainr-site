// Photo filter: turns originals into web-ready masters with one shared warm, grainy look.
//
//   media-originals/<name>.(jpg|jpeg|png|webp)  ->  src/assets/photos/<name>.jpg
//
// Per image: apply EXIF orientation, cap the longest edge, nudge contrast and saturation,
// lay a warm tint, add desaturated film grain, and encode a JPEG with ALL metadata
// (EXIF, GPS, ICC) stripped. The look is tuned in scripts/photo-filter.config.json.
//
// Usage: npm run photos [-- --force] [-- --input <dir>] [-- --output <dir>]

import { readdir, readFile, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const force = args.includes('--force');
const argValue = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? path.resolve(args[i + 1]) : fallback;
};
const inputDir = argValue('--input', path.join(root, 'media-originals'));
const outputDir = argValue('--output', path.join(root, 'src', 'assets', 'photos'));
const configPath = path.join(root, 'scripts', 'photo-filter.config.json');

const SUPPORTED = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const JUNK = new Set(['thumbs.db', 'desktop.ini']);

const fail = (message) => {
  console.error(`\nphotos: ${message}`);
  process.exit(1);
};

const config = JSON.parse(await readFile(configPath, 'utf8'));
const configMtime = (await stat(configPath)).mtimeMs;

const hexToRgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

// Lowercase, hyphenated names: Netlify's filesystem is case-sensitive, Windows' is not.
const slug = (name) =>
  name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '');

// Per-photo corrections live under "adjustments" in the config, keyed by output name without the
// extension. They fix the capture (they do not change the shared look):
//   rotate        90, 180 or 270 degrees clockwise, for sideways files with no EXIF tag
//   crop          { left, top, width, height } in pixels of the orientation-corrected original
//   whiteBalance  { red, blue } channel multipliers, e.g. { "red": 1.1, "blue": 0.85 } cools less
//   tameBlues     0 to 1: how much to quiet blue, cyan and violet-blue colours (skin, reds and
//                 the rest are left alone), e.g. to calm a saturated blue stage backdrop
const ADJUSTMENT_KEYS = new Set(['rotate', 'crop', 'whiteBalance', 'tameBlues']);

function checkAdjustments(name, adj) {
  for (const key of Object.keys(adj)) {
    if (!ADJUSTMENT_KEYS.has(key)) fail(`adjustments for "${name}": unknown setting "${key}". Allowed: ${[...ADJUSTMENT_KEYS].join(', ')}.`);
  }
  if (adj.rotate && ![90, 180, 270].includes(adj.rotate)) fail(`adjustments for "${name}": rotate must be 90, 180 or 270.`);
  if (adj.rotate && adj.crop) fail(`adjustments for "${name}": crop and rotate cannot be combined. Crop a photo that is already upright.`);
  if (adj.tameBlues !== undefined && !(adj.tameBlues >= 0 && adj.tameBlues <= 1)) fail(`adjustments for "${name}": tameBlues must be between 0 and 1.`);
}

// Reduce the saturation of blue-ish hues (about 180 to 280 degrees) in place. `data` is raw RGB.
function tameBlues(data, amount) {
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const max = Math.max(r, g, b);
    const delta = max - Math.min(r, g, b);
    if (delta < 0.02) continue;
    let hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
    // Full effect from 195 to 265 degrees, easing to none by 180 and 280.
    let weight = 0;
    if (hue >= 195 && hue <= 265) weight = 1;
    else if (hue > 180 && hue < 195) weight = (hue - 180) / 15;
    else if (hue > 265 && hue < 280) weight = (280 - hue) / 15;
    if (!weight) continue;
    const chroma = max * (delta / max) * (1 - amount * weight);
    const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = max - chroma;
    let rgb;
    if (hue < 60) rgb = [chroma, x, 0];
    else if (hue < 120) rgb = [x, chroma, 0];
    else if (hue < 180) rgb = [0, chroma, x];
    else if (hue < 240) rgb = [0, x, chroma];
    else if (hue < 300) rgb = [x, 0, chroma];
    else rgb = [chroma, 0, x];
    data[i] = Math.round((rgb[0] + m) * 255);
    data[i + 1] = Math.round((rgb[1] + m) * 255);
    data[i + 2] = Math.round((rgb[2] + m) * 255);
  }
}

async function applyLook(srcPath, outPath) {
  const { maxEdge, quality, contrast, saturation, warmth, grain } = config;
  const name = path.parse(outPath).name;
  const adj = config.adjustments?.[name] ?? {};
  checkAdjustments(name, adj);

  // 1. Orient from EXIF, then apply this photo's own corrections (rotate or crop), cap the size,
  //    and correct the white balance. Read the raw pixels.
  let pipeline = sharp(srcPath).autoOrient();
  if (adj.rotate) pipeline = pipeline.rotate(adj.rotate);
  if (adj.crop) pipeline = pipeline.extract(adj.crop);
  pipeline = pipeline
    .resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: true })
    .removeAlpha()
    .toColourspace('srgb');
  if (adj.whiteBalance) {
    const { red = 1, blue = 1 } = adj.whiteBalance;
    pipeline = pipeline.recomb([[red, 0, 0], [0, 1, 0], [0, 0, blue]]);
  }
  const corrected = await pipeline.raw().toBuffer({ resolveWithObject: true });
  if (adj.tameBlues) tameBlues(corrected.data, adj.tameBlues);

  // 2. The shared look starts here: contrast and saturation.
  const { data, info } = await sharp(corrected.data, {
    raw: { width: corrected.info.width, height: corrected.info.height, channels: corrected.info.channels },
  })
    .linear(contrast, 128 * (1 - contrast))
    .modulate({ saturation })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // 3. Film grain: grey Gaussian noise generated small, then enlarged so the grain is coarse
  //    enough to survive Astro's downscaling to delivery sizes. Mid-grey is neutral under overlay.
  const gw = Math.max(1, Math.round(width / grain.size));
  const gh = Math.max(1, Math.round(height / grain.size));
  const noise = await sharp({
    create: {
      width: gw,
      height: gh,
      channels: 3,
      background: { r: 128, g: 128, b: 128 },
      noise: { type: 'gaussian', mean: 128, sigma: grain.strength * 100 },
    },
  })
    .greyscale()
    .toColourspace('srgb')
    .resize(width, height, { kernel: 'cubic' })
    .png()
    .toBuffer();

  // 4. Warm tint, then grain, then encode. No withMetadata(): sharp drops EXIF, GPS and ICC.
  const tint = { ...hexToRgb(warmth.color), alpha: warmth.opacity };
  await sharp(data, { raw: { width, height, channels } })
    .composite([
      { input: { create: { width, height, channels: 4, background: tint } }, blend: 'over' },
      { input: noise, blend: 'overlay' },
    ])
    .jpeg({ quality, mozjpeg: true })
    .toFile(outPath);
}

// ---- main ----

let entries;
try {
  entries = await readdir(inputDir, { withFileTypes: true });
} catch {
  fail(`input folder not found: ${inputDir}`);
}

const photos = [];
const ignored = [];
for (const entry of entries) {
  const lower = entry.name.toLowerCase();
  // Dotfiles, OS junk, and folders starting with "_" (e.g. _unused/) are ignored silently.
  if (entry.name.startsWith('.') || JUNK.has(lower)) continue;
  if (entry.isDirectory() && entry.name.startsWith('_')) continue;
  if (!entry.isFile() || !SUPPORTED.has(path.extname(lower))) {
    ignored.push(entry.name + (entry.isDirectory() ? '/' : ''));
    continue;
  }
  photos.push({ file: entry.name, out: slug(path.parse(entry.name).name) + '.jpg' });
}

// Two originals must never map to the same output name.
const seen = new Map();
for (const { file, out } of photos) {
  if (seen.has(out)) fail(`"${seen.get(out)}" and "${file}" would both become "${out}". Rename one of them.`);
  seen.set(out, file);
}

if (ignored.length) {
  console.warn(
    `photos: skipped ${ignored.length} item(s) that are not JPEG, PNG or WebP files (convert HEIC and other formats first, no subfolders):\n  ${ignored.join('\n  ')}\n`,
  );
}
if (!photos.length) {
  console.log(`photos: no images found in ${path.relative(root, inputDir) || inputDir}. Drop originals there and run again.`);
  process.exit(0);
}

await mkdir(outputDir, { recursive: true });

let processed = 0;
let skipped = 0;
for (const { file, out } of photos) {
  const srcPath = path.join(inputDir, file);
  const outPath = path.join(outputDir, out);

  let upToDate = false;
  if (!force) {
    try {
      const outMtime = (await stat(outPath)).mtimeMs;
      upToDate = outMtime > (await stat(srcPath)).mtimeMs && outMtime > configMtime;
    } catch {
      // no output yet
    }
  }
  if (upToDate) {
    skipped++;
    continue;
  }

  try {
    await applyLook(srcPath, outPath);
  } catch (error) {
    fail(`could not process "${file}": ${error.message}`);
  }
  const { size } = await stat(outPath);
  console.log(`  ${file} -> ${out} (${Math.round(size / 1024)} KB)`);
  processed++;
}

console.log(`photos: ${processed} processed, ${skipped} unchanged.`);
