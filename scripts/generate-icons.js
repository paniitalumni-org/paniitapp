// Generates PWA icons (192, 512, maskable-512) with a navy background and "PI" monogram.
// Requires the `sharp` dev dependency. Run: npm run generate-icons
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const OUT_DIR = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(OUT_DIR, { recursive: true });

const NAVY = "#1e3a5f";
const GOLD = "#e7b139";

function svgIcon({ size, maskable }) {
  // Maskable icons need a safe zone — keep glyph within ~80% of canvas.
  const glyphScale = maskable ? 0.55 : 0.7;
  const glyphSize = Math.round(size * glyphScale);
  const fontSize = Math.round(size * 0.42);
  const radius = maskable ? 0 : Math.round(size * 0.18);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${NAVY}" />
      <stop offset="100%" stop-color="#162a45" />
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f4df95" />
      <stop offset="100%" stop-color="${GOLD}" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bg)" />
  <text
    x="50%"
    y="50%"
    text-anchor="middle"
    dominant-baseline="central"
    font-family="Georgia, 'Times New Roman', serif"
    font-weight="700"
    font-size="${fontSize}"
    fill="#ffffff"
  >PI</text>
  <rect
    x="${(size - glyphSize) / 2}"
    y="${size - Math.round(size * 0.12)}"
    width="${glyphSize}"
    height="${Math.round(size * 0.025)}"
    rx="${Math.round(size * 0.012)}"
    fill="url(#gold)"
  />
</svg>`;
}

async function emit(size, name, maskable = false) {
  const svg = svgIcon({ size, maskable });
  const out = path.join(OUT_DIR, name);
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(`  wrote ${name}`);
}

(async () => {
  console.log("Generating PWA icons →", OUT_DIR);
  await emit(192, "icon-192.png");
  await emit(512, "icon-512.png");
  await emit(512, "icon-maskable-512.png", true);
  console.log("Done.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
