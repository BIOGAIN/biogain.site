import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import rehypeFigureCaption from './src/lib/rehype-figure-caption.mjs';
import rehypeBasePaths from './src/lib/rehype-base-paths.mjs';

const SITE_BASE = '';

export default defineConfig({
  site: 'https://biogain-project.eu',
  base: SITE_BASE,
  integrations: [
    react(),
    mdx(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // Exclude low-value/duplicate URLs: the full news archive (duplicates the
      // paginated /news listing), the client-side search page, and the /output
      // parent (a noindex redirect to /output/publications).
      filter: (page) =>
        !/\/(news\/archive|search|output)\/?$/.test(page),
    }),
  ],
  markdown: {
    rehypePlugins: [rehypeFigureCaption, [rehypeBasePaths, { base: SITE_BASE }]],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
