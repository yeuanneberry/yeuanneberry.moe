// @ts-check
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import externalLinks from "./external-links.mjs";
import sitemap from "@astrojs/sitemap";
import { site } from "./site.config.mjs";

// https://astro.build/config
export default defineConfig({
  site: site.url,
  integrations: [react(), ...(site.indexable ? [sitemap({ filter: page => !page.endsWith("/404/") && !page.endsWith("/404.html") })] : [])],
  output: "static",
  markdown: { processor: satteri({ hastPlugins: [externalLinks] }) },
});
