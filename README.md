# Yeuanne Berry

A personal portfolio, five project case studies, a curated public-code collection,
and a searchable Berry configuration manual. The featured websites were delivered
through Yappers; each case study records the owner's specific contribution.

Astro + React, static output. Reading, project navigation and repository links
work without JavaScript; only documentation search hydrates a React island.
The approved portrait supplies the profile, favicon and touch icon. Fonts and
preview images are served locally. There is no login, database, telemetry or
visitor-side GitHub request.

## Local use

Use Node >=22.23.4 and the pinned pnpm 12.11.2. No environment file is needed.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The local site listens on http://127.0.0.1:4321. No domain or deployment is
configured. The intended domain is yeuanneberry.moe; purchase and DNS are deferred.

```sh
pnpm check
```

This checks reader integrity, types, the static production build, and Chromium
at desktop/phone sizes. Install the matching browser once with
`pnpm exec playwright install chromium` if needed. Test screenshots/traces under
test-results are ignored. The test preview uses Astro's `--ignore-lock` mode so
Playwright owns its foreground lifetime in agent environments.

## Content ownership

`apps/web/src/data/work.ts` owns the reviewed project records. Keep contribution,
visual credits and Yappers attribution accurate. A source field stays null unless
the code is public. Public GitHub metadata is curated in `data/repositories.ts`;
forks are labelled and no unverified changes, metrics or stack are claimed.

The six manual chapters are generated from exact committed Berry desktop guides.
That repository owns presets and manual content; the website owns presentation.
Follow [reader maintenance](docs/READER-MAINTENANCE.md) to refresh them. The
source-publication flag prevents links to an unpublished candidate. Private
machine/AI sources are not imported into this reader.

Original code and documentation use [MIT](LICENSE). Read the separate
[asset notices](NOTICE.md) before reusing images or fonts. Domain configuration
and website deployment are separate from source publication.

## Dependencies

Direct versions and pnpm-lock.yaml are pinned. Preserve the tested React
integration 7.0.0 / Vite React plugin 6.1.1 / oxc-transform-react 0.145.0 peer
combination unless a deliberate update resolves all peer requirements. Keep
`pnpm peers check` clean. No generator or global tooling update is needed to edit
this site.
