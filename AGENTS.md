# Yeuanne Berry portfolio

This repository owns Yeuanne Berry's portfolio and its Berry documentation
reader. Read README.md and NOTICE.md before editing.

- Use Astro + React with static output. The six-chapter index is static;
  no React islands currently hydrate. Active section highlighting uses vanilla
  JavaScript and must preserve native heading links, URL history and focus.
  Mobile navigation uses native dialog and vanilla JavaScript with a no-JS fallback.
  Its early controller must work before optional animation downloads. Use the
  shared Lucide Icon component and respect reduced-motion preferences.
- About's ASCII portrait is generated from the approved artwork using the
  reviewed foreground-mask.svg; outside the character stays blank. Regenerate
  with scripts/generate-ascii-portrait.mjs; keep its mask/text/manifest together.
- Keep metadata exactly "Yeuanne Berry" and copy direct. External links open a
  new tab with noopener/noreferrer and an accessible hint; internal routes stay put.
- pnpm is the package manager. Keep exact direct versions and pnpm-lock.yaml.
- Reusable configuration and guide content belong to berry-desktop.
  Reader articles are generated from the reviewed allowlist in
  docs/reader-sources.json. Follow docs/READER-MAINTENANCE.md; author content
  upstream, then review and refresh. Never hand-edit generated chapters.
- The portfolio may feature the five approved projects delivered through Yappers;
  keep configuration guides Berry-focused. Preserve confirmed contribution credits.
  Keep branding independent of desktop wallpaper and fandom names. The explicitly
  supplied portrait is approved for the profile and favicon.
- Keep credentials, live configuration, operational receipts, account setup,
  deployment actions and remote administration outside the reader.
- Use one writer per file. The coordinator owns manifests, lockfiles, tests,
  documentation, Git, installation and final verification. A task worker owns
  only the paths named in its task brief and must not spawn further workers.
- Use semantic HTML, visible keyboard focus, readable contrast and reduced motion.
- Prefer the patch tool for source edits. Shell commands must be one reliable
  physical line; complex logic belongs in a complete repository-owned script,
  validated and invoked explicitly. Do not author files through shell heredocs.
- The selected task brief is the coordinator's reviewed plan. Work directly from
  it and the relevant code; avoid repeating global setup or unrelated inventories.
- Validate with pnpm check. Browser tests exercise the production preview at
  desktop and phone sizes. Inspect real screenshots for visual changes.
- No deployment, domain/DNS changes, sign-in, global changes or model experiments
  are part of this task. Domain setup is deferred by the owner.
