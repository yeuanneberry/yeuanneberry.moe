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
// Keep this selection explicit after reviewing the three rendered candidates.
const selectedCandidate = "edge-enhanced";
const candidates = [
  { id: "balanced", label: "Balanced negative", polarity: "dark-source-to-dense-light-glyphs", gamma: 0.82, ceiling: 0.90, edgeWeight: 0 },
  { id: "positive", label: "Positive tones", polarity: "light-source-to-dense-light-glyphs", gamma: 0.92, ceiling: 1, edgeWeight: 0 },
  { id: "edge-enhanced", label: "Positive tones with source-edge detail", polarity: "light-source-to-dense-light-glyphs", gamma: 0.92, ceiling: 1, edgeWeight: 0.45 },
];
const options = {
  crop: "full-source-square",
  contrastPercentiles: [1, 99],
  sourceDetailRadius: 2,
  sourceDetailAmount: 0.35,
  backgroundCutoff: 0.02,
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
if (args.length > 1 || (args.length === 1 && !["--check", "--preview", "--candidates"].includes(args[0]))) {
  throw new Error("Usage: node scripts/generate-ascii-portrait.mjs [--check|--preview|--candidates]");
}
const check = args[0] === "--check";
const preview = args[0] === "--preview";
const compare = args[0] === "--candidates";
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
const lightness = Float32Array.from(grayscale, (value) => clamp((value - low) / (high - low)));
const detail = new Float32Array(grayscale.length);
const edges = new Float32Array(grayscale.length);
const at = (x, y) => lightness[Math.max(0, Math.min(metadata.height - 1, y)) * metadata.width + Math.max(0, Math.min(metadata.width - 1, x))];
// Enhance detail before reducing to character cells, rather than detecting
// glasses/eyes only after thin lines have already been averaged away.
for (let y = 0; y < metadata.height; y++) {
  for (let x = 0; x < metadata.width; x++) {
    const index = y * metadata.width + x;
    if (!mask[index]) continue;
    const r = options.sourceDetailRadius;
    const mean = (at(x - r, y - r) + at(x, y - r) + at(x + r, y - r)
      + at(x - r, y) + at(x, y) + at(x + r, y)
      + at(x - r, y + r) + at(x, y + r) + at(x + r, y + r)) / 9;
    detail[index] = lightness[index] - mean;
    const gx = -at(x - 1, y - 1) + at(x + 1, y - 1) - 2 * at(x - 1, y) + 2 * at(x + 1, y) - at(x - 1, y + 1) + at(x + 1, y + 1);
    const gy = -at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1) + at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1);
    edges[index] = clamp(Math.hypot(gx, gy) / 4);
  }
}
const resizeCells = async (buffer, grid) => sharp(buffer, { raw: { width: metadata.width, height: metadata.height, channels: 1 } })
  .resize(grid.columns, grid.rows, { fit: "fill", kernel: options.resampling })
  .greyscale().raw().toBuffer();
const coverages = await Promise.all(grids.map((grid) => resizeCells(mask, grid)));
const comparisons = [];
for (const candidate of candidates) {
  const ink = Buffer.from(lightness.map((value, index) => {
    const enhanced = clamp(value + options.sourceDetailAmount * detail[index]
      + candidate.edgeWeight * edges[index] * Math.sign(detail[index]));
    const tone = candidate.polarity.startsWith("dark-") ? 1 - enhanced : enhanced;
    return Math.round(255 * candidate.ceiling * tone ** candidate.gamma * mask[index] / 255);
  }));
  const artifacts = [];
  for (const [gridIndex, grid] of grids.entries()) {
    const pixels = await resizeCells(ink, grid);
    const coverage = coverages[gridIndex];
    if (pixels.length !== grid.columns * grid.rows || coverage.length !== pixels.length) throw new Error("ASCII sampling requires one channel per cell.");
    const lines = [];
    for (let y = 0; y < grid.rows; y++) {
      let line = "";
      for (let x = 0; x < grid.columns; x++) {
        const index = y * grid.columns + x;
        const density = pixels[index] / 255;
        line += coverage[index] / 255 < options.minimumMaskCoverage || density < options.backgroundCutoff
          ? " " : ramp[Math.round(density * (ramp.length - 1))];
      }
      lines.push(line);
    }
    const text = `${lines.join("\n")}\n`;
    artifacts.push({ ...grid, text, sha256: sha256(text) });
  }
  comparisons.push({ ...candidate, artifacts });
}
const selected = comparisons.find((candidate) => candidate.id === selectedCandidate);
if (!selected) throw new Error("Unknown selected candidate.");
const artifacts = selected.artifacts;
if (compare) console.log(JSON.stringify({ schema: 1, selectedCandidate, options, candidates: comparisons }));
if (preview) for (const candidate of comparisons) for (const artifact of candidate.artifacts) console.log(`${candidate.label}: ${artifact.file}\n${artifact.text}`);

const manifest = {
  schema: 1,
  source: { path: sourcePath, sha256: sha256(source), width: metadata.width, height: metadata.height },
  mask: { path: maskPath, sha256: sha256(maskSource), kind: "hand-reviewed-svg-foreground-selection", foregroundContrastPixels: sorted.length },
  generator: { path: "scripts/generate-ascii-portrait.mjs", sha256: sha256(await readFile(fileURLToPath(import.meta.url))), sharp: sharp.versions.sharp, vips: sharp.versions.vips },
  options,
  selectedCandidate: Object.fromEntries(Object.entries(selected).filter(([key]) => key !== "artifacts")),
  contrastBounds: [low, high],
  artifacts: artifacts.map(({ text, ...artifact }) => artifact),
  notice: "Derived from the supplied profile artwork; excluded from the source-code MIT license. See NOTICE.md.",
};
const outputs = artifacts.map(({ file, text }) => [file, text]);
outputs.push(["manifest.json", `${JSON.stringify(manifest, null, 2)}\n`]);
if (!preview && !compare) {
  if (!check) await mkdir(new URL(outputPath, root), { recursive: true });
  for (const [file, expected] of outputs) {
    const destination = new URL(`${outputPath}${file}`, root);
    if (check) {
      if (await readFile(destination, "utf8") !== expected) throw new Error(`Stale generated artifact: ${file}`);
    } else await writeFile(destination, expected);
  }
  console.log(`${check ? "Verified" : "Generated"} ${outputs.length} deterministic ASCII portrait artifacts.`);
}
