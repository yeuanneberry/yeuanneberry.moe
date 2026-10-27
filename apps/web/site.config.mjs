// Explicit build settings. Local and preview builds stay unindexed by default.
const configured = process.env.SITE_URL?.trim();
let url;
if (configured) {
  const parsed = new URL(configured);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("SITE_URL must be an HTTPS origin without credentials, path, query or fragment.");
  }
  url = parsed.origin;
}
const indexing = process.env.SITE_INDEXABLE ?? "false";
if (!["true", "false"].includes(indexing)) throw new Error("SITE_INDEXABLE must be true or false.");
const indexable = indexing === "true";
if (indexable && !url) throw new Error("Indexable builds require SITE_URL.");
export const site = { url, indexable };

const analyticsSetting = process.env.CF_WEB_ANALYTICS_ENABLED ?? "false";
if (!["true", "false"].includes(analyticsSetting)) throw new Error("CF_WEB_ANALYTICS_ENABLED must be true or false.");
export const analyticsEnabled = analyticsSetting === "true";
const analyticsToken = process.env.CF_WEB_ANALYTICS_TOKEN?.trim();
if (analyticsEnabled && (!indexable || !url || !/^[a-f0-9]{32}$/i.test(analyticsToken ?? ""))) {
  throw new Error("Analytics requires an indexable HTTPS build and a valid public Web Analytics site token.");
}
// No beacon is present by default. Even an enabled production build stays silent
// when opened locally or on a preview hostname. This identifier is not an API key.
export const analyticsBootstrap = analyticsEnabled ? `(() => {
  if (window.location.origin !== ${JSON.stringify(url)}) return;
  const script = document.createElement("script");
  script.src = "https://static.cloudflareinsights.com/beacon.min.js";
  script.defer = true;
  script.dataset.cfBeacon = ${JSON.stringify(JSON.stringify({ token: analyticsToken }))};
  document.head.append(script);
})();` : "";
