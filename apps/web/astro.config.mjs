// @ts-check
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import externalLinks from "./external-links.mjs";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: "static",
  markdown: { processor: satteri({ hastPlugins: [externalLinks] }) },
});
