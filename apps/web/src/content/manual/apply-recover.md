---
title: "Apply & recover"
description: "Review a change, keep backups, and recover one application at a time."
group: "Setup"
order: 4
repository: "berry-desktop"
sourcePath: "docs/apply-recover.md"
sourceUrl: "https://github.com/yeuanneberry/berry-desktop/blob/a90591ace12cd408ae030b440d0e6612891b26a8/docs/apply-recover.md"
sourceRevision: "a90591ace12cd408ae030b440d0e6612891b26a8"
sourcePublished: true
reviewed: "2026-10-26"
generated: true
---

# Apply and recover

## Changes are manual and per application

There is no `install.sh`, apply engine, privileged command or service toggle in
this edition. The only executable helper is a read-only source verifier. It does
not make backups, refuse live-file drift or roll back your desktop. Do not confuse
its source-integrity checks with a deployment transaction.

Before adopting a file, close only the target application if its configuration
can be rewritten on exit. Keep a known-good terminal/session open. Inspect the
destination using your file manager or editor. If it is a symlink, find its owner
and stop rather than overwriting it; another dotfiles manager may own that path.

## Backup and compare

1. Record whether the target existed, its type, mode and current content.
2. Make a separate backup of the original file, including permissions. For a
   directory such as a GTK theme, preserve the entire existing directory.
3. Compare the backup/current content with your reviewed staged file.
4. If the live file changed after your review, stop and compare again. There is
   no automatic drift guard; do not overwrite unknown changes.
5. Copy only the intended file, or merge the relevant settings. Use the exact
   destination in the [reference](/docs/reference/), respecting your own XDG paths.
6. Reopen the application and test ordinary behavior. Do not reload your whole
   compositor or restart unrelated services merely to test an app theme.

Backups and personal receipts belong outside the public repository. Never publish
your original config merely to document a successful copy.

## Recover

Close the target application. Compare the current destination with the version
you installed so later edits are preserved. Restore the backed-up file/directory
and permissions, then reopen the app. If the target was absent originally, remove
only the exact newly added file after confirming it still matches your copy;
leave unrelated directories and files alone. Review includes you added manually.

This is a manual recovery procedure, not tested full-session rollback. There are
no package, systemd, sudoers, PAM, boot, DNS, GPU or storage changes to reverse from
this collection. If you performed other changes separately, recover those using
their owning procedures.
