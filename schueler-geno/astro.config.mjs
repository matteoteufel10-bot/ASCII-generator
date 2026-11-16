import { defineConfig } from 'astro/config';

// Adresse der Website. Bei GitHub Pages werden beide Werte automatisch
// gesetzt (siehe .github/workflows/website-veroeffentlichen.yml).
// Nur bei einer eigenen Domain muss hier etwas angepasst werden.
export default defineConfig({
  site: process.env.SITE_URL || 'http://localhost:4321',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always',
});
