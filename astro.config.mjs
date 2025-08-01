import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import compressor from 'astro-compressor';
import {defineConfig} from 'astro/config';

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
      ],
      brotli: true,
      gzip: true,
    })
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
    maxDuration: 1,
  }),
});