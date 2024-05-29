import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel/static';
import {defineConfig} from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://www.nileis.de',
  integrations: [react(), sitemap()],
  adapter:
      vercel({webAnalytics: {enabled: true}, speedInsights: {enabled: true}})
});