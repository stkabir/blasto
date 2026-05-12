const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.resolve(__dirname, 'favicon.svg');
const pngPath = path.resolve(__dirname, 'favicon.png');

const svg = fs.readFileSync(svgPath, 'utf-8');

const sizes = [32, 64, 128, 192, 512];

async function generate() {
  for (const size of sizes) {
    const outPath = size === 32 ? pngPath : path.resolve(__dirname, `favicon-${size}.png`);
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated ${outPath}`);
  }
}

generate().catch(console.error);
