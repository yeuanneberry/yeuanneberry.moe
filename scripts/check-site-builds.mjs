#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const origin = "https://portfolio.example.test";
for (const [url, indexable] of [["", "true"], ["http://example.test", "true"], [`${origin}/nested/`, "false"], ["https://user:example@example.test", "false"], [origin, "yes"]]) {
  const invalid = spawnSync(process.execPath, ["--input-type=module", "--eval", "await import('./apps/web/site.config.mjs')"], {
    cwd: fileURLToPath(root), encoding: "utf8", env: { ...process.env, SITE_URL: url, SITE_INDEXABLE: indexable },
  });
  assert.notEqual(invalid.status, 0, "Invalid site settings must fail rather than silently generate launch metadata.");
}
for (const fixture of [
  { name: "local", url: "", indexable: false },
  { name: "preview", url: origin, indexable: false },
  { name: "production", url: origin, indexable: true },
]) {
  const directory = new URL(`test-results/site-builds/${fixture.name}/`, root);
  const build = spawnSync("pnpm", ["--filter", "web", "build", "--outDir", fileURLToPath(directory)], {
    cwd: fileURLToPath(root), encoding: "utf8",
    env: { ...process.env, SITE_URL: fixture.url, SITE_INDEXABLE: String(fixture.indexable) },
  });
  if (build.status !== 0) throw new Error(build.stdout + build.stderr);
  const read = path => readFile(new URL(path, directory), "utf8");
  const home = await read("index.html");
  const chapter = await read("docs/customize/index.html");
  const missing = await read("404.html");
  assert.ok(/<title>Yeuanne Berry<\/title>/.test(home), `${fixture.name}: plain title`);
  assert.ok(/property="og:image" content="https?:[^\"]+\/social-card.png"/.test(home), `${fixture.name}: share image URL`);
  assert.ok(/name="robots" content="noindex, nofollow"/.test(missing), `${fixture.name}: 404 must stay unindexed`);
  if (fixture.url) {
    assert.ok(home.includes(`rel="canonical" href="${origin}/"`));
    assert.ok(chapter.includes(`rel="canonical" href="${origin}/docs/customize/"`));
    assert.ok(home.includes(`property="og:image" content="${origin}/social-card.png"`));
  } else assert.doesNotMatch(home, /rel="canonical"/);
  if (fixture.indexable) {
    assert.match(home, /name="robots" content="index, follow"/);
    assert.ok((await read("robots.txt")).includes(`Sitemap: ${origin}/sitemap-index.xml`));
    const sitemap = await read("sitemap-0.xml");
    assert.ok(sitemap.includes(`${origin}/docs/customize/`));
    assert.ok(sitemap.includes(`${origin}/work/softlysang/`));
    assert.doesNotMatch(sitemap, /404|localhost|127\.0\.0\.1/);
  } else {
    assert.match(home, /name="robots" content="noindex, nofollow"/);
    assert.equal(await read("robots.txt"), "User-agent: *\nDisallow: /\n");
    await assert.rejects(access(new URL("sitemap-index.xml", directory)));
  }
  console.log(`PASS ${fixture.name}: metadata, canonical URLs, robots, sitemap and 404`);
}
