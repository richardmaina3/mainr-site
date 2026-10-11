import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { iconNames } from './lib/pixelIcons';

/*
  Content schemas (engineering_design.md §4). Every JSON file in src/content/ is a plain
  object or array. The loaders below wrap each one as a single entry so Astro's file()
  loader accepts it, and so authors never write `id` keys by hand.

  Rules enforced at build time: `alt` is required on every image, `image` paths must
  resolve to a real file, and skill tiers are 1 to 6. Pixel sizes never appear in JSON.
*/

const singleton = (path: string, id: string) =>
  file(path, { parser: (text) => [{ id, ...JSON.parse(text) }] });

const listAs = (path: string, id: string, key: string) =>
  file(path, { parser: (text) => [{ id, [key]: JSON.parse(text) }] });

const text = z.string().trim().min(1);
const alt = z.string().trim().min(1, 'alt text is required on every image');

const icon = z.enum(iconNames);

// Position on the 1200px-wide desktop collage canvas. Ignored below 1100px.
const pos = z.object({ x: z.number(), y: z.number(), rotate: z.number() });

const intro = z.object({ title: text, text });

const site = defineCollection({
  loader: singleton('src/content/site.json', 'site'),
  schema: z.object({
    name: text,
    email: text,
    eyebrow: text,
    // "\n" in the headline becomes a line break.
    headline: text,
    subline: text,
    ctaPrimary: text,
    ctaSecondary: text,
    // Page sections in order. `id` is the anchor (#work). The label also builds the
    // section heading, e.g. "01 / WORK".
    nav: z.array(z.object({ id: text, label: text })).min(1),
    // Footer credit for the pixel icons (Streamline Pixel is CC BY 4.0). `url` makes it a link.
    attribution: z.object({ text, url: z.url().optional() }),
    // Omit until Richard has a LinkedIn URL; the footer link only renders when this is set.
    linkedin: z.url().optional(),
    meta: z.object({
      title: text,
      description: text,
      // Path in /public (e.g. "/og-image.jpg"), 1200x630. `ogImageAlt` is its description.
      ogImage: z.string().optional(),
      ogImageAlt: z.string().optional(),
    }),
  }),
});

const hero = defineCollection({
  loader: singleton('src/content/hero.json', 'hero'),
  schema: ({ image }) =>
    z.object({
      portrait: z.object({
        image: image(),
        alt,
        caption: text,
        year: text,
        focus: z.string().optional(),
      }),
      aboutNote: intro,
      stickers: z.array(icon).length(3),
    }),
});

const work = defineCollection({
  loader: singleton('src/content/work.json', 'work'),
  schema: z.object({
    lead: text,
    // Decorative filename in the retro window's title bar.
    skillsWindowTitle: text,
    blocks: z
      .array(
        z.object({
          id: text,
          icon,
          title: text,
          anchor: text,
          body: text,
          link: z.object({ label: text, url: z.url() }).optional(),
        }),
      )
      .length(3),
  }),
});

const skills = defineCollection({
  loader: listAs('src/content/skills.json', 'skills', 'words'),
  schema: z.object({
    // Array order is display order.
    words: z.array(
      z.object({
        label: text,
        tier: z.number().int().min(1).max(6),
        font: z.enum(['sans', 'pixel']),
        accent: z.boolean(),
      }),
    ),
  }),
});

const cooking = defineCollection({
  loader: singleton('src/content/cooking.json', 'cooking'),
  schema: ({ image }) =>
    z.object({
      intro,
      dishes: z.array(
        z.object({
          id: text,
          image: image(),
          alt,
          name: text,
          note: text,
          date: text,
          rotate: z.number().optional(),
          side: z.enum(['left', 'right']).optional(),
          focus: z.string().optional(),
        }),
      ),
    }),
});

const culture = defineCollection({
  loader: singleton('src/content/culture.json', 'culture'),
  schema: ({ image }) =>
    z.object({
      intro,
      albums: z.array(z.object({ image: image(), alt, artist: text, album: text, pos })),
      // `year` is optional (and a blank one is treated as none): the placard then shows just the artist and title.
      museum: z.array(z.object({ image: image(), alt, artist: text, title: text, year: z.string().trim().optional(), pos })),
      sports: z.array(
        z.object({
          image: image(),
          alt,
          event: text,
          date: text,
          section: z.string().optional(),
          row: z.string().optional(),
          pos,
        }),
      ),
      rightNow: z.object({ title: text, listening: text, watching: text, visiting: text }),
    }),
});

export const collections = { site, hero, work, skills, cooking, culture };
