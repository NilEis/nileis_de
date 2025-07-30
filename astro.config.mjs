import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import compressor from 'astro-compressor';
import {defineConfig} from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  site: 'https://www.nileis.de',

  integrations: [
    react(), sitemap({
      filter: (page) => {
        return !page.includes('/admin/')
      }
    }),
    compressor()
  ],

  // adapter: vercel({
  //   webAnalytics: {enabled: true},
  //   speedInsights: {enabled: true},
  //   maxDuration: 1,
  // }),

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: cloudflare(),
});