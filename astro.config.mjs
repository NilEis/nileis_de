import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import compressor from 'astro-compressor';
import {defineConfig} from 'astro/config';

import compress_cleanup from './integrations/compress-cleanup';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://www.nileis.de',

  integrations: [
    sitemap({
      filter: (page) => {
        return !page.includes('/admin/')
      }
    }),
    compressor({
      fileExtensions: [
        '.css', '.js', '.html', '.xml', '.cjs', '.mjs', '.svg', '.txt', '.wasm'
      ]
    }),
    compress_cleanup()
  ],

  // adapter: vercel({
  //   webAnalytics: {enabled: true},
  //   speedInsights: {enabled: true},
  //   maxDuration: 1,
  // }),

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: vercel({
    webAnalytics: {enabled: true},
    speedInsights: {enabled: true},
    maxDuration: 1,
  }),
});