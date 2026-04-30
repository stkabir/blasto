const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const files = ['game.js', 'player.js', 'asteroid.js', 'boss.js', 'powerup.js'];

async function build() {
  const isWatch = process.argv.includes('--watch');

  for (const file of files) {
    const inputPath = path.join(__dirname, 'js', file);
    const outputPath = path.join(__dirname, 'js', file.replace('.js', '.min.js'));

    const options = {
      entryPoints: [inputPath],
      outfile: outputPath,
      minify: true,
      legalComments: 'none',
    };

    if (isWatch) {
      const ctx = await esbuild.context(options);
      await ctx.watch();
      console.log(`Watching ${file}...`);
    } else {
      await esbuild.build(options);
      console.log(`Obfuscated: ${file} -> ${path.basename(outputPath)}`);
    }
  }

  if (!isWatch) {
    console.log('\nDone! Update HTML to use .min.js files');
  }
}

build().catch(() => process.exit(1));