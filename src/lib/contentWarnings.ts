import { getEntry } from 'astro:content';

// Soft limits (engineering_design.md §4): warnings, not errors, to keep the page scannable.
const MAX_BLOCK_BODY = 320;
const MAX_SKILLS = 30;
const MAX_DISH_NOTE = 120;
const PLACEHOLDER_EMAIL = 'your@email.com';

/** Prints content warnings during a production build. Never throws. */
export async function warnOnContent(): Promise<void> {
  if (!import.meta.env.PROD) return;

  const [site, work, skills, cooking] = await Promise.all([
    getEntry('site', 'site'),
    getEntry('work', 'work'),
    getEntry('skills', 'skills'),
    getEntry('cooking', 'cooking'),
  ]);

  const warnings: string[] = [];

  if (site?.data.email === PLACEHOLDER_EMAIL) {
    warnings.push('site.json: email is still the placeholder. Contact links will not work.');
  }
  for (const block of work?.data.blocks ?? []) {
    if (block.body.length > MAX_BLOCK_BODY) {
      warnings.push(`work.json: "${block.title}" body is ${block.body.length} characters (soft limit ${MAX_BLOCK_BODY}).`);
    }
  }
  const wordCount = skills?.data.words.length ?? 0;
  if (wordCount > MAX_SKILLS) {
    warnings.push(`skills.json: ${wordCount} words (soft limit ${MAX_SKILLS}).`);
  }
  for (const dish of cooking?.data.dishes ?? []) {
    if (dish.note.length > MAX_DISH_NOTE) {
      warnings.push(`cooking.json: note for "${dish.name}" is ${dish.note.length} characters (soft limit ${MAX_DISH_NOTE}).`);
    }
  }

  for (const warning of warnings) console.warn(`[content warning] ${warning}`);
}
