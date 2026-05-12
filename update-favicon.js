const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function updateFavicon() {
  const result = await esbuild.build({
    entryPoints: ['src/ui/logo.ts'],
    bundle: true,
    format: 'cjs',
    write: false,
    outfile: 'logo-bundle.js',
  });

  const mod = { exports: {} };
  const fn = new Function('module', 'exports', result.outputFiles[0].text);
  fn(mod, mod.exports);

  const svg = mod.exports.getFaviconSVG();
  fs.writeFileSync(path.resolve(__dirname, 'favicon.svg'), svg);
  console.log('Updated favicon.svg from getFaviconSVG()');
}

updateFavicon().catch(console.error);
