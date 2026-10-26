#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Offline derivative of the approved artwork; never generates or invents detail.
const root = new URL("../", import.meta.url);
const sourcePath = "apps/web/src/assets/profile.png";
const maskPath = "apps/web/src/assets/ascii/foreground-mask.svg";
const outputPath = "apps/web/src/assets/ascii/";
const ramp = " .:-=+*#%@";
const options = {
  crop: "full-source-square",
  polarity: "dark-source-to-dense-light-glyphs",
  contrastPercentiles: [1, 99],
  edgeWeight: 0.12,
  backgroundCutoff: 0.055,
  minimumMaskCoverage: 0.08,
  maskSampling: "premultiplied-foreground-ink-and-antialiased-cell-coverage",
  cellWidthToHeight: 0.6,
  resampling: "lanczos3",
  ramp,
};
const grids = [
  { file: "portrait-desktop.txt", columns: 80, rows: 48 },
  { file: "portrait-mobile.txt", columns: 48, rows: 29 },
];
const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && !["--check", "--preview"].includes(args[0]))) {
  throw new Error("Usage: node scripts/generate-ascii-portrait.mjs [--check|--preview]");
}
const check = args[0] === "--check";
const preview = args[0] === "--preview";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const clamp = (value) => Math.min(1, Math.max(0, value));
const source = await readFile(new URL(sourcePath, root));
const maskSource = await readFile(new URL(maskPath, root));
const metadata = await sharp(source).metadata();
if (metadata.width !== 1024 || metadata.height !== 1024) throw new Error("Review source dimensions before regenerating.");
const grayscale = await sharp(source).greyscale().raw().toBuffer();
const mask = await sharp(maskSource).resize(metadata.width, metadata.height)
  .greyscale().removeAlpha().raw().toBuffer();
if (mask.length !== grayscale.length) throw new Error("Mask and source channel dimensions differ.");
// Background pixels never affect contrast or ink. Half-covered source pixels
// are excluded from contrast estimation but retained in antialiased sampling.
const sorted = [...grayscale].filter((_, index) => mask[index] >= 128).sort((a, b) => a - b);
if (!sorted.length) throw new Error("Foreground mask is empty.");
const low = sorted[Math.floor((sorted.length - 1) * options.contrastPercentiles[0] / 100)];
const high = sorted[Math.floor((sorted.length - 1) * options.contrastPercentiles[1] / 100)];
if (high <= low) throw new Error("Source contrast is insufficient.");
const ink = Buffer.from(grayscale.map((value, index) => Math.round(255 * (1 - clamp((value - low) / (high - low))) * mask[index] / 255)));
const artifacts = [];

for (const grid of grids) {
  const pixels = await sharp(ink, { raw: { width: metadata.width, height: metadata.height, channels: 1 } })
    .resize(grid.columns, grid.rows, { fit: "fill", kernel: "lanczos3" })
    .greyscale().raw().toBuffer();
  const coverage = await sharp(mask, { raw: { width: metadata.width, height: metadata.height, channels: 1 } })
    .resize(grid.columns, grid.rows, { fit: "fill", kernel: "lanczos3" })
    .greyscale().raw().toBuffer();
  if (pixels.length !== grid.columns * grid.rows || coverage.length !== pixels.length) throw new Error("ASCII sampling requires one channel per cell.");
  const at = (x, y) => pixels[Math.max(0, Math.min(grid.rows - 1, y)) * grid.columns + Math.max(0, Math.min(grid.columns - 1, x))] / 255;
  const render = (invert) => {
    const lines = [];
    for (let y = 0; y < grid.rows; y++) {
      let line = "";
      for (let x = 0; x < grid.columns; x++) {
        const index = y * grid.columns + x;
        const cellCoverage = coverage[index] / 255;
        if (cellCoverage < options.minimumMaskCoverage) {
          line += " ";
          continue;
        }
        const foregroundInk = pixels[index] / 255;
        const gx = -at(x - 1, y - 1) + at(x + 1, y - 1) - 2 * at(x - 1, y) + 2 * at(x + 1, y) - at(x - 1, y + 1) + at(x + 1, y + 1);
        const gy = -at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1) + at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1);
        const edge = clamp(Math.hypot(gx, gy) / 4);
        let density = clamp((invert ? cellCoverage - foregroundInk : foregroundInk) + options.edgeWeight * edge * cellCoverage);
        if (density < options.backgroundCutoff) density = 0;
        line += ramp[Math.round(density * (ramp.length - 1))];
      }
      lines.push(line);
    }
    return `${lines.join("\n")}\n`;
  };
  const text = render(false);
  artifacts.push({ ...grid, text, sha256: sha256(text) });
  if (preview) {
    console.log(`${grid.file}: selected dark-to-dense rendering\n${text}`);
    console.log(`${grid.file}: comparison light-to-dense rendering\n${render(true)}`);
  }
}

const manifest = {
  schema: 1,
  source: { path: sourcePath, sha256: sha256(source), width: metadata.width, height: metadata.height },
  mask: { path: maskPath, sha256: sha256(maskSource), kind: "hand-reviewed-svg-foreground-selection", foregroundContrastPixels: sorted.length },
  generator: { path: "scripts/generate-ascii-portrait.mjs", sha256: sha256(await readFile(fileURLToPath(import.meta.url))), sharp: sharp.versions.sharp, vips: sharp.versions.vips },
  options,
  contrastBounds: [low, high],
  artifacts: artifacts.map(({ text, ...artifact }) => artifact),
  notice: "Derived from the supplied profile artwork; excluded from the source-code MIT license. See NOTICE.md.",
};
const outputs = artifacts.map(({ file, text }) => [file, text]);
outputs.push(["manifest.json", `${JSON.stringify(manifest, null, 2)}\n`]);
if (!preview) {
  if (!check) await mkdir(new URL(outputPath, root), { recursive: true });
  for (const [file, expected] of outputs) {
    const destination = new URL(`${outputPath}${file}`, root);
    if (check) {
      if (await readFile(destination, "utf8") !== expected) throw new Error(`Stale generated artifact: ${file}`);
    } else await writeFile(destination, expected);
  }
  console.log(`${check ? "Verified" : "Generated"} ${outputs.length} deterministic ASCII portrait artifacts.`);
}
