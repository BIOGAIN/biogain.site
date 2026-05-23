import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import rehypeFigureCaption from './src/lib/rehype-figure-caption.mjs';
import rehypeBasePaths from './src/lib/rehype-base-paths.mjs';

const SITE_BASE = '/biogain.site';

export default defineConfig({
  site: 'https://biogain.github.io',
  base: SITE_BASE,
  integrations: [
    react(),
    mdx(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
  markdown: {
    rehypePlugins: [rehypeFigureCaption, [rehypeBasePaths, { base: SITE_BASE }]],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
