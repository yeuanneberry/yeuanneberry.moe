#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = new URL("../", import.meta.url);
const generated = spawnSync(process.execPath, ["scripts/generate-ascii-portrait.mjs", "--candidates"], {
  cwd: fileURLToPath(root), encoding: "utf8",
});
if (generated.status !== 0) throw new Error(generated.stderr || "Portrait candidates failed.");
const { candidates } = JSON.parse(generated.stdout);
const font = await readFile(new URL("apps/web/public/fonts/JetBrainsMono-Regular.ttf", root));
const styles = await readFile(new URL("apps/web/src/styles/ascii-portrait.css", root), "utf8");
const escape = text => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const output = new URL("test-results/ascii-comparison/", root);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
try {
  for (const width of [1440, 375, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.setContent(`<!doctype html><html lang="en"><meta charset="utf-8"><title>Portrait comparison</title>
      <style>@font-face{font-family:"JetBrains Mono";src:url(data:font/ttf;base64,${font.toString("base64")})}
      :root{--paper:#d9d4c5}*{box-sizing:border-box}body{margin:0;background:#191c1c;color:var(--paper);font-family:"JetBrains Mono",monospace}
      main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,490px),1fr));gap:32px;padding:16px}
      section{min-width:0}h2{font-size:14px;font-weight:400;margin:0 0 16px}${styles}</style><main>
      ${candidates.map(candidate => `<section><h2>${escape(candidate.label)}</h2><figure class="ascii-portrait">
        ${candidate.artifacts.map(artifact => `<pre class="ascii-portrait-${artifact.file.includes("desktop") ? "desktop" : "mobile"}">${escape(artifact.text.slice(0, -1))}</pre>`).join("")}
      </figure></section>`).join("")}</main></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: fileURLToPath(new URL(`${width}.png`, output)), fullPage: true });
    await page.close();
  }
} finally { await browser.close(); }
console.log("Portrait comparisons: test-results/ascii-comparison/{1440,375,320}.png");
