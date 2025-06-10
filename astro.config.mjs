import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";

import compressor from "astro-compressor";

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: "https://www.nileis.de",
  integrations: [react(), sitemap(), tailwind(), compressor()],
  adapter: vercel({
    webAnalytics: { enabled: true },
    speedInsights: { enabled: true },
    maxDuration: 1,
  }),
});