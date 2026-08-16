const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');
const options = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: 'dist/extension.js',
  sourcemap: watch,
  external: ['vscode'],
  minify: false,
  logLevel: 'info'
};

const webviewOptions = {
  entryPoints: ['src/webview/index.ts'],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2020',
  outfile: 'dist/webview.js',
  sourcemap: watch,
  loader: { '.css': 'text' },
  minify: false,
  logLevel: 'info'
};

async function main() {
  if (watch) {
    const context = await esbuild.context(options);
    const webviewContext = await esbuild.context(webviewOptions);
    await Promise.all([context.watch(), webviewContext.watch()]);
    console.log('Watching for changes...');
  } else {
    await Promise.all([esbuild.build(options), esbuild.build(webviewOptions)]);
  }
}

main().catch(() => process.exit(1));
