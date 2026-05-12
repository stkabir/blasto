const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function build() {
  const isWatch = process.argv.includes('--watch');

  const devOptions = {
    entryPoints: [path.join(__dirname, 'src', 'main.ts')],
    outfile: path.join(__dirname, 'dist', 'game.js'),
    bundle: true,
    minify: false,
    sourcemap: 'inline',
    legalComments: 'none',
    target: 'es2020',
    format: 'iife',
  };

  const prodOptions = {
    entryPoints: [path.join(__dirname, 'src', 'main.ts')],
    outfile: path.join(__dirname, 'dist', 'game.min.js'),
    bundle: true,
    minify: true,
    sourcemap: false,
    legalComments: 'none',
    target: 'es2020',
    format: 'iife',
  };

  if (isWatch) {
    devOptions.sourcemap = 'inline';
    const ctx = await esbuild.context(devOptions);
    await ctx.watch();
    console.log('Watching src/main.ts...');
  } else {
    await Promise.all([
      esbuild.build(devOptions),
      esbuild.build(prodOptions),
    ]);
    console.log('Built: dist/game.js (dev)');
    console.log('Built: dist/game.min.js (prod)');

    copyDir(path.join(__dirname, 'dist'), path.join(__dirname, 'www', 'dist'));
    if (fs.existsSync(path.join(__dirname, 'css'))) {
      copyDir(path.join(__dirname, 'css'), path.join(__dirname, 'www', 'css'));
    }
    if (fs.existsSync(path.join(__dirname, 'index.html'))) {
      fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(__dirname, 'www', 'index.html'));
    }
    for (const f of ['favicon.svg', 'favicon.png', 'social.png']) {
      const src = path.join(__dirname, f);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(__dirname, 'www', f));
      }
    }

    console.log('Copied assets to www/');
    console.log('\nDone! Production ready.');
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

build().catch(() => process.exit(1));
