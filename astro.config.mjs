import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";

import compressor from "astro-compressor";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: "https://www.nileis.de",
  integrations: [react(), sitemap(), compressor()],

  adapter: vercel({
    webAnalytics: { enabled: true },
    speedInsights: { enabled: true },
    maxDuration: 1,
  }),

  vite: {
    plugins: [tailwindcss()],
  },
});