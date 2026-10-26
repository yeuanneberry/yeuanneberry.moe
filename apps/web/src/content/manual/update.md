---
title: "Keep it updated"
description: "Pin a baseline, compare local changes, and update with a way back."
group: "Setup"
order: 5
repository: "berry-desktop"
sourcePath: "docs/update.md"
sourceUrl: "https://github.com/yeuanneberry/berry-desktop/blob/a90591ace12cd408ae030b440d0e6612891b26a8/docs/update.md"
sourceRevision: "a90591ace12cd408ae030b440d0e6612891b26a8"
sourcePublished: true
reviewed: "2026-10-26"
generated: true
---

# Update a reviewed baseline

## Pin what you use

Use [the canonical repository](https://github.com/yeuanneberry/berry-desktop) and
record the exact commit you adopt. Keep the selected preset as a reviewed baseline
and personal values separately. Clone or fork if you want to follow upstream
changes. A template-created copy is an independent snapshot and does not receive
updates automatically. Source availability is not fresh-machine acceptance.

Fetching a new commit is a source operation. It does not apply configuration to
your home. Review upstream diffs, release notes, dependency requirements and
`source-selection.json` changes before moving your pin. Do not run newly fetched
scripts automatically and do not pipe network content into a shell.

## Review local drift

Compare three versions: the old baseline, the new baseline and your current local
configuration. Preserve intentional personal choices. If you edited a baseline
file directly, treat those edits as local drift; do not assume all differences
should be reset. Use native includes or a small local patch for future changes.

The verifier detects changes to selected configuration files relative to the
checked-in manifest. It deliberately has no command to bless arbitrary new
hashes. A maintainer updates that manifest only alongside reviewed source changes
and their explanation; a user should not edit it merely to clear a failure.

## Adopt and roll back one app

Repeat the [manual backup and comparison](/docs/apply-recover/) for each application.
Evaluate the staged new preset before changing a working destination. Retain your
old source pin and the live pre-update backup. To roll back, restore that backup
with its permissions, reopen the application and retain later unrelated edits.

A branch is useful for public experiments, not secrets. Send reusable fixes to
the baseline owner rather than maintaining another complete desktop copy. Active
private deployments are not redirected by publishing or updating this source;
their migration requires its own review and recovery checkpoint.
