# Launch preparation

Workers Static Assets configuration is prepared. No hosting project, deployment,
domain purchase, DNS change or live analytics was created or enabled. Astro stays
static with no SSR adapter, application server, database or account credential.

## Local proof

`pnpm check` includes `pnpm check-cloudflare`. It runs Wrangler locally on
127.0.0.1:4323, checks headers, trailing-slash routing and a genuine 404, then
terminates its process group. It also serves a synthetic analytics-enabled build
locally and under an intercepted example origin. A stub replaces the beacon;
no live analytics leaves the test. Wrangler metrics are disabled.

Use `pnpm preview:cloudflare` to inspect the current default build with the same
local asset server. Astro dev/preview does not apply `_headers`; local Wrangler
proof remains separate from deployed edge behavior and launch acceptance.

## Security policy

Astro emits a hashed CSP in each built page. The early menu script gets an explicit
hash from its source bytes. No-JavaScript navigation uses a local stylesheet.
No `unsafe-inline` or `unsafe-eval` is allowed; HTML event attributes are disabled.

Four exact Shiki style strings are allowed through attribute-only hashes in
`apps/web/security.mjs`. Astro logs a generic Shiki/CSP warning; browser checks
verify these hashes, computed colors and absence of CSP errors. Review new styles
after theme/processor changes instead of permitting arbitrary inline CSS.

`apps/web/public/_headers` supplies framing, MIME, referrer and browser-feature
restrictions, plus HTTPS HSTS without subdomain/preload enrollment. Hash-named
assets get immutable caching. Its CSP header contains only `frame-ancestors` so
it does not intersect with and block Astro's script/style hashes.

## Optional analytics

Analytics is off by default. Alongside the [site settings](SITE-BUILDS.md):

| Build variable | Default | Meaning |
| --- | --- | --- |
| `CF_WEB_ANALYTICS_ENABLED` | `false` | Include one Web Analytics bootstrap |
| `CF_WEB_ANALYTICS_TOKEN` | unset | Public 32-hex site identifier, never an API token |

Enabling requires an indexable HTTPS build and valid site identifier. The beacon
runs only when the browser's exact origin matches `SITE_URL`, so local/alternate
previews stay silent. Only enabled builds permit its exact script/reporting
endpoints in CSP. Use this manual integration or automatic injection, never both.
The public Privacy page reflects the build's actual setting.

Web Analytics covers traffic and real-user performance, without cookie or local
storage access. It has no custom events or UTM attribution; do not present it as
contact conversions or marketing ROI. Beacons may be lost/blocked and reports
may be sampled. No visitor data was collected during this preparation.

## Later launch

Confirm domain ownership/origin, review hosting limits, and obtain deployment/DNS
authorization. Create the project, supply reviewed build settings, and verify
deployed headers, routing, share image and indexing. Enable the single analytics
integration only when authorized, then verify actual reporting separately from
local stub proof. Preserve the prior deployment for rollback once one exists.

Official references reviewed 2026-10-27:

- [New-project recommendation](https://developers.cloudflare.com/pages/)
- [Asset headers](https://developers.cloudflare.com/workers/static-assets/headers/)
- [HTML routing](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)
- [Analytics beacon](https://developers.cloudflare.com/speed/observatory/rum-beacon/)
- [Analytics limits](https://developers.cloudflare.com/web-analytics/faq/)
- [Astro CSP](https://docs.astro.build/en/reference/configuration-reference/#securitycsp)
