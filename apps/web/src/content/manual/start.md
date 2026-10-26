---
title: "Start with one app"
description: "Prerequisites, source verification, and staging your first preset."
group: "Setup"
order: 2
repository: "berry-desktop"
sourcePath: "docs/start.md"
sourceUrl: "https://github.com/yeuanneberry/berry-desktop/blob/a90591ace12cd408ae030b440d0e6612891b26a8/docs/start.md"
sourceRevision: "a90591ace12cd408ae030b440d0e6612891b26a8"
sourcePublished: true
reviewed: "2026-10-26"
generated: true
---

# Start with one application

## Prerequisites

Use a Linux account you control and an existing working session. You need Python 3
for the bounded verifier, Git if following updates, and whichever application you
choose to configure. JetBrains Mono is the configured font; select an installed
alternative if necessary. No font or executable is bundled. No package manager,
sudo, login or network operation is performed by the verifier.

Review the [reference](/docs/reference/), upstream application documentation and your
distribution packages. Fuzzel opens Foot as its terminal; change that setting if
Foot is not installed. mpv's Wayland backend is unsuitable for an X11-only setup.

## Inspect before adopting

From the checked-out repository root:

```sh
python3 -I -S -B tools/verify.py
```

PASS means the selected candidate bytes match the reviewed manifest, links resolve
locally, and the bounded paths pass checks. It is not installation or rendering
acceptance. A failure is a reason to inspect drift, not regenerate trusted hashes.

Start with an application preset, not the compositor. Read it in your editor and compare it with the existing
application configuration. Do not recursively copy `config/` into your home.
Keep your terminal and working session open while evaluating replacements.

## Stage without changing your home

For example, make a new disposable directory you own, copy
`config/kitty/kitty.conf` there, and edit the staged copy. Run Kitty with its native
`--config` option pointing to that file only when ready to test rendering.
Launching it is an explicit local application action; the verifier never does it.
Use your own chosen directory path, not someone else's home path.

Check fonts, color contrast, copy/paste and application behavior. The supplied
Kitty preset preserves your default shell. Do not replace your current settings
until the staged result is useful. [Apply and recover](/docs/apply-recover/) describes
the manual backup and rollback boundary.
