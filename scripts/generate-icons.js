// Generates PWA icons (192, 512, maskable-512) with PAN IIT brand navy + white "PI" monogram.
// Run: npm run generate-icons
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const OUT_DIR = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(OUT_DIR, { recursive: true });

const BRAND = "#1B1464";

function svgIcon({ size, maskable }) {
  const fontSize = Math.round(size * 0.42);
  const radius = maskable ? 0 : Math.round(size * 0.18);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${BRAND}" />
  <text
    x="50%"
    y="50%"
    text-anchor="middle"
    dominant-baseline="central"
    font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    font-weight="700"
    font-size="${fontSize}"
    fill="#ffffff"
    letter-spacing="-2"
  >PI</text>
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
