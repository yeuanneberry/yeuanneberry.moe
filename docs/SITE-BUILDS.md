# Site build settings

Local and preview builds are unindexed by default. No domain, DNS record or
hosting project is created by a build. The intended domain is still deferred.

`apps/web/site.config.mjs` reads these explicit build environment variables:

| Variable | Default | Meaning |
| --- | --- | --- |
| `SITE_URL` | unset | Final HTTPS origin, without a path, query or credentials |
| `SITE_INDEXABLE` | `false` | Emit indexable metadata and a sitemap only when `true` |

Preview builds may supply the intended production origin for canonical links and
social cards while keeping `SITE_INDEXABLE=false`. Local builds without an origin
omit canonicals and use localhost social URLs; these are for local review.
Production sharing requires the confirmed origin. Build settings are explicit
process environment values, not automatically loaded from a root `.env` file.

After the launch origin is confirmed, the source-only production build command is:

```sh
SITE_URL=https://yeuanneberry.moe SITE_INDEXABLE=true pnpm build
```

This command builds files only. Domain purchase, hosting and DNS are separate.
Previews need their own build with indexing disabled; a production artifact keeps
its production metadata wherever it is served. The 404 page always stays
unindexed and is excluded from the sitemap.

`scripts/generate-social-card.mjs` generates the 1200x630 PNG before root build/dev
commands. It composes the approved original portrait and local font; the generated
public file is ignored. Preserve its artwork and font notices. The original
profile image and all metadata titles/descriptions retain the owner's choices.

`pnpm check-site-builds` builds isolated local, preview and synthetic production
fixtures under ignored `.cache/site-builds`. It checks canonicals, social
URLs, robots rules, sitemap contents, 404 indexing and invalid settings without
connecting to the example origin. A fourth synthetic analytics-enabled fixture
supports the local Cloudflare check. These fixtures never deploy. See
[launch preparation](LAUNCH.md) for security and optional analytics maintenance.
