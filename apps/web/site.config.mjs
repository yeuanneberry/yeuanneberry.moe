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
