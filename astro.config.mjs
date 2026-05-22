import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import rehypeFigureCaption from './src/lib/rehype-figure-caption.mjs';

export default defineConfig({
  site: 'https://biogain.site',
  integrations: [
    react(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
  markdown: {
    rehypePlugins: [rehypeFigureCaption],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
