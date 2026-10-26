# Reader maintenance

The explicit `reader-sources.json` allowlist selects six canonical Markdown
guides from Berry desktop at a committed revision. Generated files under
`apps/web/src/content/manual` are reader projections, not a second authoring
location. Edit and review the owning guide first, commit it, then update the
manifest's revision and refresh. Review the full diff before changing its date.

```sh
python3 -B scripts/sync-reader.py --write --berry-desktop ../berry-desktop
```

The projector reads committed source with Git, normalizes selected chapter links
to local routes and pins outside-library links to their source revision. It makes
no upstream writes or network calls. Use `--prune` only after explicitly reviewing
removed chapters. Private AI and operational sources are outside the allowlist.

```sh
python3 -B scripts/sync-reader.py --check --berry-desktop ../berry-desktop
```

The source comparison checks source/selection/projection hashes and linked Git
objects. `pnpm check-reader` verifies local files against the lock without needing
the source checkout. This catches accidental drift; it does not authenticate a
deliberately rewritten lock or prove that an upstream review happened.

The repository's `published` flag is false for an unpublished local candidate.
It suppresses source hyperlinks while retaining revision/path information.
Set it true only after verifying anonymous access to the exact remote commit and
linked files, then regenerate. Website deployment must not precede that check.

```sh
python3 -B scripts/sync-reader.py --verify-public
```

This opt-in network check sends no credentials. It compares the pinned public
guide bytes with the recorded source hashes and checks emitted source links.
The regular local check and source projector perform no network reads.

Run `pnpm check` and inspect desktop/phone screenshots after reader changes.
No-JavaScript reading, full-text search, category intersection, keyboard focus,
deep links, article links and overflow are browser-checked. Reading a guide does
not apply its configuration; installation and live application acceptance remain
with the desktop source's documented procedures.
