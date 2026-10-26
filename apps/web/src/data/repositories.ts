export interface PublicRepository {
  name: string;
  url: string;
  description: string;
  fork: boolean;
  license: string | null;
}

// Reviewed public GitHub metadata, 2026-10-26. Refresh deliberately, never with
// a browser token or an authenticated request in a visitor's session.
export const repositories: readonly PublicRepository[] = [
  {
    name: "Berry desktop",
    url: "https://github.com/yeuanneberry/berry-desktop",
    description: "Reusable Arch Linux application presets, a minimal Hyprland and Waybar baseline, and guides for adapting them.",
    fork: false,
    license: "MIT",
  },
  {
    name: "Career Compass",
    url: "https://github.com/yeuanneberry/Immersion-and-Programming-Colab-PT",
    description: "A school collaboration exploring career guidance through a web application.",
    fork: false,
    license: null,
  },
  {
    name: "Typora Vercel dark theme",
    url: "https://github.com/yeuanneberry/typora-vercel-dark-theme",
    description: "A fork of a dark theme for the Typora Markdown editor.",
    fork: true,
    license: "MIT",
  },
  {
    name: "Antigravity usage",
    url: "https://github.com/yeuanneberry/antigravity-usage",
    description: "A fork of a command-line tool for model quota and usage information.",
    fork: true,
    license: "MIT",
  },
  {
    name: "Typora themes website",
    url: "https://github.com/yeuanneberry/theme.typora.io",
    description: "A fork of the website for discovering Typora themes.",
    fork: true,
    license: null,
  },
];
