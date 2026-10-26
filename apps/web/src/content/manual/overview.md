---
title: "Berry overview"
description: "What Berry includes, how it is organized, and the scope of the configuration collection."
group: "Desktop"
order: 1
repository: "berry-desktop"
sourcePath: "docs/overview.md"
sourceUrl: "https://github.com/yeuanneberry/berry-desktop/blob/a90591ace12cd408ae030b440d0e6612891b26a8/docs/overview.md"
sourceRevision: "a90591ace12cd408ae030b440d0e6612891b26a8"
sourcePublished: true
reviewed: "2026-10-26"
generated: true
---

# Berry desktop overview

Berry is a collection you can adopt one application at a time. It shares real
configuration text, with a muted palette and restrained decoration. It is not a
distribution, complete compositor/session configuration, or snapshot of a home.

## What is included

A minimal Hyprland Lua preset and Waybar panel; terminal presets for Kitty and Foot;
Fuzzel launcher and Mako notification styles;
mpv and Zathura defaults; a Btop theme; GTK 3 CSS; and a Qt6ct color scheme.
See the [file reference](/docs/reference/) for exact destinations and dependencies.
The explicit selection and transformations live in `source-selection.json`.

## Supported scope and evidence

| Area | Evidence / status |
| --- | --- |
| Intended platform | Arch Linux, Linux user applications; Wayland for Foot/Fuzzel/Mako and mpv preset |
| Selected source provenance | Pinned configuration bytes and transformations recorded |
| Candidate integrity | Read-only hash, path and documentation-link checks |
| Lua syntax | `luac -p` passed for the selected Hyprland preset; no execution |
| Fresh machine or VM | Not tested; no complete installation acceptance |
| Application / compositor rendering | Not tested for this candidate; current versions may differ |
| Hyprland API names | Named APIs checked against installed Hyprland 0.56.2 official stubs/example; no runtime argument or session acceptance |
| Backup and restore | Manual procedure documented; no automated transaction engine |
| Device-specific hardware/display/input profiles | Not supplied or validated; generic monitor and input defaults are included |
| GTK 4 / libadwaita | Not supplied; GTK 3 CSS is not a universal application theme |
| Other distributions | Not tested |

These files originated from an existing personal setup. Extracting them does not
prove they recreate that desktop or work on every version. Application packages,
fonts and session services remain your responsibility.

## Ownership and privacy

Use one reusable baseline and separate local choices. A public Git branch cannot
hold secrets: all its reachable history shares the repository's visibility.
Keep tokens, machine identifiers and personal settings outside a public fork.
This repository owns future reusable changes to the selected files. Existing
private installations retain their operational history and pinned source until a
separate controlled migration; they are not a second reusable authoring location.

Read [Start](/docs/start/) before copying anything. Original configuration, tools and
guides are MIT licensed; see `LICENSE` and `NOTICE.md` in the repository root.
