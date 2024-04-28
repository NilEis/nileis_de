import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel/static';
import {defineConfig, passthroughImageService} from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.nileis.de',
  integrations: [react(), sitemap()],
  adapter:
      vercel({webAnalytics: {enabled: true}, speedInsights: {enabled: true}}),
  image: {service: passthroughImageService()}
});