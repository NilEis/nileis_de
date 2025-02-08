import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel/static";
import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: "https://www.nileis.de",
  integrations: [react(), sitemap(), tailwind()],
  adapter: vercel({
    webAnalytics: { enabled: true },
    speedInsights: { enabled: true },
    maxDuration: 1
  }),
});
