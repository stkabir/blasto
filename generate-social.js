const esbuild = require('esbuild');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generate() {
  const result = await esbuild.build({
    entryPoints: [path.join(__dirname, 'src', 'ui', 'logo.ts')],
    bundle: true,
    format: 'cjs',
    write: false,
  });

  const mod = { exports: {} };
  const fn = new Function('module', 'exports', result.outputFiles[0].text);
  fn(mod, mod.exports);

  const svg = mod.exports.getSocialSVG();
  const outPath = path.resolve(__dirname, 'social.png');
  await sharp(Buffer.from(svg))
    .resize(1200, 630)
    .png()
    .toFile(outPath);
  console.log(`Generated ${outPath}`);
}

generate().catch(console.error);
