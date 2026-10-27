#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const fontfile = fileURLToPath(new URL("apps/web/public/fonts/JetBrainsMono-Regular.ttf", root));
const portrait = await sharp(fileURLToPath(new URL("apps/web/src/assets/profile.png", root)))
  .resize(280, 280).png().toBuffer();
const name = await sharp({ text: { text: '<span foreground="#eee8d9">Yeuanne Berry</span>', font: "JetBrains Mono 52", fontfile, rgba: true } }).png().toBuffer();
const frame = Buffer.from('<svg width="1200" height="630"><rect x="32" y="32" width="1136" height="566" fill="none" stroke="#363d3b"/><path d="M96 400H704" stroke="#8e977b" stroke-width="2"/></svg>');
await sharp({ create: { width: 1200, height: 630, channels: 4, background: "#191c1c" } })
  .composite([{ input: frame }, { input: name, left: 96, top: 275 }, { input: portrait, left: 824, top: 175 }])
  .png().toFile(fileURLToPath(new URL("apps/web/public/social-card.png", root)));
console.log("Generated 1200x630 social card from the approved portrait and local font.");
