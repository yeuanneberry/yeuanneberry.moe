#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { once } from "node:events";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = new URL("../", import.meta.url);
const local = "http://127.0.0.1:4323";
const production = "https://portfolio.example.test";
const probe = createServer();
await new Promise((resolve, reject) => { probe.once("error", reject); probe.listen(4323, "127.0.0.1", resolve); });
await new Promise(resolve => probe.close(resolve));
const cli = fileURLToPath(new URL("node_modules/wrangler/bin/wrangler.js", root));
const server = spawn(process.execPath, [cli, "dev", "--local", "--ip", "127.0.0.1", "--port", "4323", "--assets", ".cache/site-builds/analytics", "--log-level", "error"], {
  cwd: fileURLToPath(root), stdio: ["ignore", "pipe", "pipe"], detached: true,
  env: { ...process.env, WRANGLER_SEND_METRICS: "false", CLOUDFLARE_API_TOKEN: "", CLOUDFLARE_ACCOUNT_ID: "" },
});
let logs = "";
server.stdout.on("data", chunk => { logs += chunk; });
server.stderr.on("data", chunk => { logs += chunk; });
let browser;
const isRunning = () => server.exitCode === null && server.signalCode === null;
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (!isRunning()) throw new Error(logs || "Local Cloudflare preview exited before becoming ready.");
    try { ready = (await fetch(local, { signal: AbortSignal.timeout(1000) })).ok; } catch {}
    if (ready) break;
    await delay(200);
  }
  assert.ok(ready, `Local Cloudflare preview did not start. ${logs}`);
  const response = await fetch(local);
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("content-security-policy"), "frame-ancestors 'none'");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  const about = await fetch(`${local}/about`);
  assert.equal(new URL(about.url).pathname, "/about/");
  assert.equal((await fetch(`${local}/missing-page/`)).status, 404);
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  // First prove that even an analytics-enabled artifact stays silent locally.
  const preview = await browser.newPage();
  const outbound = [];
  await preview.route("**/*", route => {
    if (new URL(route.request().url()).origin !== local) { outbound.push(route.request().url()); return route.abort(); }
    return route.continue();
  });
  await preview.goto(`${local}/`);
  await preview.evaluate(() => document.fonts.ready);
  assert.deepEqual(outbound, []);
  await preview.close();
  // Emulate the production origin entirely through local responses. The real
  // beacon is replaced with a stub; no analytics request leaves this process.
  const page = await browser.newPage();
  const beaconRequests = [];
  const reportRequests = [];
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin === production) {
      const result = await fetch(`${local}${url.pathname}${url.search}`);
      const headers = Object.fromEntries(result.headers);
      delete headers["content-encoding"];
      delete headers["content-length"];
      return route.fulfill({ status: result.status, headers, body: Buffer.from(await result.arrayBuffer()) });
    }
    if (url.href === "https://static.cloudflareinsights.com/beacon.min.js") {
      beaconRequests.push(url.href);
      return route.fulfill({ contentType: "text/javascript", body: `
        window.__testBeaconToken = document.currentScript.dataset.cfBeacon;
        fetch("https://cloudflareinsights.com/cdn-cgi/rum", {
          method: "POST", body: "synthetic-local-check"
        }).then(response => { window.__testBeaconReported = response.ok; });
      ` });
    }
    if (url.href === "https://cloudflareinsights.com/cdn-cgi/rum") {
      assert.equal(route.request().method(), "POST");
      assert.equal(route.request().postData(), "synthetic-local-check");
      reportRequests.push(url.href);
      return route.fulfill({ status: 204, headers: { "access-control-allow-origin": production } });
    }
    errors.push(`Unexpected external request: ${url.href}`);
    return route.abort();
  });
  await page.goto(production);
  await page.waitForFunction(() => window.__testBeaconReported === true);
  assert.equal(JSON.parse(await page.evaluate(() => window.__testBeaconToken)).token, "0".repeat(32));
  assert.equal(beaconRequests.length, 1);
  assert.equal(reportRequests.length, 1);
  assert.deepEqual(errors, []);
  await page.close();
  console.log("PASS local Cloudflare headers, redirects, 404 and hostname-gated analytics (stubbed; zero live beacons)");
} finally {
  try {
    await browser?.close();
  } finally {
    if (isRunning()) {
      const stopped = once(server, "exit");
      try { process.kill(-server.pid, "SIGTERM"); } catch (error) { if (error.code !== "ESRCH") throw error; }
      await Promise.race([stopped, delay(3000)]);
      if (isRunning()) {
        try { process.kill(-server.pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; }
        await Promise.race([stopped, delay(3000)]);
        assert.ok(!isRunning(), "Local Cloudflare preview did not stop after SIGKILL.");
      }
    }
  }
}
