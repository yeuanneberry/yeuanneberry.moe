import { site } from "../../site.config.mjs";

export function GET() {
  const body = site.indexable
    ? `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap-index.xml\n`
    : "User-agent: *\nDisallow: /\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
