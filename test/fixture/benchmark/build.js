const esbuild = require('esbuild')
const {sassPlugin} = require('../../../lib')
const chokidar = require('chokidar')
const {cleanFixture} = require('../utils')

cleanFixture(__dirname)

console.time('generate')
require("./generate");
console.timeEnd('generate')

let result

const watcher = chokidar.watch('./src', {ignoreInitial: true})

const buildOptions = {
    entryPoints: ["./src/generated/index.ts"],
    bundle: true,
    format: 'esm',
    sourcemap: false,
    outdir: './out',
    define: {'process.env.NODE_ENV': '"development"'},
    incremental: true,
    plugins: [
      sassPlugin({
        'filter': /^\.\.\/index.scss$/,
        'type': 'style',
        'cache': true
      }),
      sassPlugin({
        'type': 'lit-css',
        'cache': true
      })
    ],
    logLevel: 'debug'
}

// Create a context for incremental builds
const ctx = await esbuild.context(buildOptions);

watcher.on('ready', async function () {

  console.time('initial build')
  // Manually do initial build
  await ctx.rebuild()
  console.timeEnd('initial build')
})

watcher.on('change', async function () {
  if (result !== null) {
    console.time('incremental build')

    // Manually do an incremental build
    await ctx.rebuild()

    console.timeEnd('incremental build')
  }
})
