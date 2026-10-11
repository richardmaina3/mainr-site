import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

// SITE_URL comes from .env locally and from the Netlify environment in production.
const { SITE_URL } = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');

export default defineConfig({
  site: SITE_URL || 'http://localhost:4321',
  output: 'static',
  build: {
    // The whole site is one page with a few KB of CSS, so inline it: no render-blocking request.
    inlineStylesheets: 'always',
  },
});
