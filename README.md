# Yeuanne Berry

A personal portfolio, five project case studies, a curated public-code collection,
and a six-chapter Berry configuration manual. The featured websites were delivered
through Yappers; each case study records the owner's specific contribution.

Astro + React, static output. Reading, project navigation and repository links
work without JavaScript. The chapter index renders all six guides immediately;
there are no React islands or search/filter controls. The Astro + React stack
remains configured. A small vanilla script highlights the section being read in
both contents lists, without changing URL history or moving focus. Heading links
remain native anchors and work without JavaScript.
Mobile navigation uses a full-screen native dialog with an early inline controller;
it works before animation scripts download. Without JavaScript the regular links
remain visible. Open/close buttons share the same size and header alignment. Browser and
social metadata use only "Yeuanne Berry". External links open a new tab with
noopener/noreferrer and an accessible hint; internal navigation stays in place.
The original portrait supplies high-density responsive WebP display images and
PNG favicon/touch icons. Fonts and
preview images are served locally. A build-time social card supplies large image
previews when links are shared. There is no login, database or visitor-side
GitHub request. Optional Cloudflare Web Analytics is disabled by default and
restricted to the exact configured production origin when explicitly enabled.

Selected Lucide icons render as static Astro SVGs. Motion's vanilla JavaScript
mini entry adds 220ms menu entrances and 160ms exits; CSS uses 140ms interaction
transitions and 320ms introductions. Reduced motion disables decorative movement.
Core menu behavior never waits for Motion, and interrupted transitions keep native
focus and background-scroll handling until the dialog is closed.

## Local use

Use Node >=22.23.4 and the pinned pnpm 12.11.2. No environment file is needed.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The local site listens on http://127.0.0.1:4321. No domain or deployment is
configured. The intended domain is yeuanneberry.moe; purchase and DNS are deferred.
Workers Static Assets configuration and local-only proofs are prepared; no
hosting account, deployment or live analytics was activated. See
[launch preparation](docs/LAUNCH.md) for CSP, local headers and analytics settings.
See [site build settings](docs/SITE-BUILDS.md) for explicit production URLs and
indexing. Local/preview builds remain unindexed by default; production fixtures
are checked locally without publishing them.

```sh
pnpm check
```

This checks reader integrity, types, the static production build, and Chromium
at desktop/phone sizes, plus separate preview/production metadata builds and
initial asset budgets, plus local Cloudflare headers/routing and a stubbed
analytics fixture. [Performance notes](docs/PERFORMANCE.md) distinguish local
loading observations from real visitor metrics. Install the matching browser once with
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

The native Markdown visitor in `apps/web/external-links.mjs` adds new-tab behavior
to rendered guide links. Keep this presentation rule out of generated chapters.

About uses a static ASCII derivative of the supplied portrait, in 80x48 desktop
and 48x29 phone grids. A reviewed SVG foreground mask selects the character;
contrast uses those pixels and the surrounding background becomes literal spaces.
Positive tonal mapping keeps the hair dark and face light; restrained detail
enhancement before downsampling preserves the glasses, eyes and mouth. The
selected rendering is compared with two alternatives using the actual font:

```sh
node scripts/preview-ascii-portrait.mjs
```

This writes desktop/phone comparisons to ignored `test-results/ascii-comparison`.
About's Work and Berry sections sit side by side on desktop and stack on phones.
Home and About show the owner's pronunciation guide from
`apps/web/src/data/profile.ts`.
Generate or verify the portrait offline from the repository root:

```sh
node scripts/generate-ascii-portrait.mjs
pnpm check-ascii
```

Text artifacts and their source/settings/toolchain manifest are checked in under
`apps/web/src/assets/ascii` alongside `foreground-mask.svg`. After reviewing a
mask change, regenerate both sizes and the manifest together. The manifest pins
the original image and mask hashes. The generator uses locked Sharp and bundled
libvips;
`--check` verifies that toolchain's output. No visitor-side conversion, canvas or
external service is involved. Individual characters are hidden from assistive
technology; the portrait has one accessible description. Home/header images and
favicons keep using the original image. Preserve the derivative's asset notice.

Original code and documentation use [MIT](LICENSE). Read the separate
[asset notices](NOTICE.md) before reusing images or fonts. Domain configuration
and website deployment are separate from source publication.

## Dependencies

Direct versions and pnpm-lock.yaml are pinned. Preserve the tested React
integration 7.0.0 / Vite React plugin 6.1.1 / oxc-transform-react 0.145.0 peer
combination unless a deliberate update resolves all peer requirements. Keep
`pnpm peers check` clean. No generator or global tooling update is needed to edit
this site.

Wrangler is a development-only tool for local static-asset proofs. Its pinned
esbuild/workerd installers are the two approved package builds. Exact release-age
exceptions in `pnpm-workspace.yaml` cover Wrangler and its bundled Miniflare
version; review those exceptions when deliberately upgrading the local tool.
