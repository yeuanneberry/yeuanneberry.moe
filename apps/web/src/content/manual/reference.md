---
title: "Files & troubleshooting"
description: "Configuration destinations, application dependencies, and common fixes."
group: "Reference"
order: 6
repository: "berry-desktop"
sourcePath: "docs/reference.md"
sourceUrl: "https://github.com/yeuanneberry/berry-desktop/blob/a90591ace12cd408ae030b440d0e6612891b26a8/docs/reference.md"
sourceRevision: "a90591ace12cd408ae030b440d0e6612891b26a8"
sourcePublished: true
reviewed: "2026-10-26"
generated: true
---

# Files and troubleshooting

## Destination reference

`$XDG_CONFIG_HOME` means your configured XDG directory, conventionally
`$HOME/.config`. These are manual destinations, not automatic copy instructions.

| Source | Destination / requirement |
| --- | --- |
| `config/hypr/hyprland.lua` | `$XDG_CONFIG_HOME/hypr/hyprland.lua`; compatible Hyprland Lua API; retain working compositor recovery |
| `config/waybar/config.json` | `$XDG_CONFIG_HOME/waybar/config.json`; Waybar with native Hyprland/network/audio modules |
| `config/waybar/style.css` | `$XDG_CONFIG_HOME/waybar/style.css`; Waybar, font |
| `config/kitty/kitty.conf` | `$XDG_CONFIG_HOME/kitty/kitty.conf`; Kitty, font |
| `config/foot/foot.ini` | `$XDG_CONFIG_HOME/foot/foot.ini`; Foot, Wayland, font |
| `config/fuzzel/fuzzel.ini` | `$XDG_CONFIG_HOME/fuzzel/fuzzel.ini`; Fuzzel, Wayland, Foot or edited terminal |
| `config/mako/config` | `$XDG_CONFIG_HOME/mako/config`; Mako, Wayland, font |
| `config/mpv/mpv.conf` | `$XDG_CONFIG_HOME/mpv/mpv.conf`; mpv with Wayland GPU support |
| `config/zathura/zathurarc` | `$XDG_CONFIG_HOME/zathura/zathurarc`; Zathura and document plugin |
| `config/btop/btop.conf` | `$XDG_CONFIG_HOME/btop/btop.conf`; Btop; replace/merge only if desired |
| `config/btop/themes/berry.theme` | `$XDG_CONFIG_HOME/btop/themes/berry.theme`; select theme `berry` |
| `config/qt6ct/colors/berry.conf` | `$XDG_CONFIG_HOME/qt6ct/colors/berry.conf`; Qt6ct; select palette separately |
| `themes/Berry/gtk-3.0/` | `$XDG_DATA_HOME/themes/Berry/gtk-3.0/`; GTK 3, installed Adwaita resource; select separately |

`$XDG_DATA_HOME` conventionally means `$HOME/.local/share`. No monitor-specific
profile, shell startup, user service or system configuration is installed.
Waybar is not auto-started; launch it explicitly only when desired.

## Hyprland and Waybar boundary

The compositor preset uses the native Lua API, not legacy `.conf` syntax.
`luac -p` passed without executing it. Named APIs were checked against installed
Hyprland 0.56.2 official stubs and its packaged example. Those checks establish
syntax and API-name evidence, not runtime argument validation or session behavior.
Compatibility with your installed version remains unverified.
Review it before use, retain your working configuration and a recovery terminal,
and consult that version's official documentation. There is no session bootstrap,
idle daemon, lock binding, screenshot binding, power menu or wallpaper service.
Do not treat this minimal preset as a secure or complete session replacement.

Native shortcuts expect Foot, Fuzzel, PCManFM, LibreWolf and Zed (`zeditor`) when
used. Media shortcuts expect `wpctl`/WirePlumber, `playerctl` and `brightnessctl`.
Remove or replace bindings for applications you do not use. The preferred-monitor
rule has no fixed display name, resolution or scale; keep device choices local.

The preset selects the US keyboard layout, natural scrolling and tap-to-click,
with the touchpad disabled while typing. Adjust these generic input preferences
for your needs. It also sets `QT_QPA_PLATFORMTHEME=qt6ct`: install/configure Qt6ct
separately if using that integration, or remove the setting for your preferred
Qt platform theme. This environment value does not select the included palette.

Waybar's optional click actions expect `pavucontrol` and `nm-connection-editor`.
Network/audio modules require corresponding session services and compiled support.
No custom Berry metric helper or reminder stylesheet is loaded. Network tooltips
show your current network address locally; there are no saved network identities.

## Common issues

**Verifier reports drift:** inspect the specific changed path. Restore it from
your known source pin or review the change; do not regenerate hashes blindly.
The check is bounded and is not a secret-scanning or application-grammar guarantee.

**Font differs:** install your chosen font using your distribution's supported
process or change the native font setting. No font asset is included.

**Launcher terminal fails:** Fuzzel's `terminal=foot` expects Foot on PATH. Change
it to a terminal you have installed, using Fuzzel's native syntax.

**mpv window fails outside Wayland:** review `gpu-context=wayland` and select a
backend supported by your session. Hardware decoding is not guaranteed by this preset.

**Some GTK apps look unchanged:** this is GTK 3 CSS, not a GTK 4/libadwaita theme.
GTK resource paths and application behavior can change with installed versions.

**Btop theme missing:** copy the theme as well as selecting its name. GPU selection
is intentionally omitted because device names and support vary.

**An application rejects a setting:** use that installed version's official
documentation and keep the prior config. Syntax/rendering compatibility of this
candidate has not been established by a fresh-machine test.
