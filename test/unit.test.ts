import * as esbuild from 'esbuild'
import {sassPlugin} from '../src'
import {readCssFile, readTextFile, useFixture, writeTextFile} from './test-toolkit'
import fs from 'fs'
import {expect} from 'chai'

describe('unit tests', function () {

  this.timeout(5000)

  let cwd
  beforeEach(function () {
    cwd = process.cwd()
  })
  afterEach(function () {
    process.chdir(cwd)
  })

  it('can handle a css import', async function () {
    const options = useFixture('variables')

    const ctx = await esbuild.context({
      ...options,
      entryPoints: ['./index-css.js'],
      outdir: './out',
      bundle: true,
      plugins: [
        sassPlugin()
      ]
    })
    const result = await ctx.rebuild()

    expect(readTextFile('out/index-css.js')).to.equalIgnoreSpaces(readTextFile('snapshot/index-css.js'))
    expect(readCssFile('out/index-css.css')).to.equalIgnoreSpaces(readCssFile('snapshot/index-css.css'))
  })

  it('can handle a scss import', async function () {
    const options = useFixture('variables')

    const ctx = await esbuild.context({
      ...options,
      entryPoints: ['./index-scss.js'],
      outdir: './out',
      bundle: true,
      plugins: [
        sassPlugin()
      ]
    })
    const result = await ctx.rebuild()

    expect(readTextFile('out/index-scss.js')).to.equalIgnoreSpaces(readTextFile('snapshot/index-scss.js'))
    expect(readCssFile('out/index-scss.css')).to.equalIgnoreSpaces(readCssFile('snapshot/index-scss.css'))
  })

  it('can handle a sass import', async function () {
    const options = useFixture('variables')

    const ctx = await esbuild.context({
      ...options,
      entryPoints: ['./index-sass.js'],
      outdir: './out',
      bundle: true,
      plugins: [
        sassPlugin()
      ]
    })
    const result = await ctx.rebuild()

    expect(readTextFile('out/index-sass.js')).to.equalIgnoreSpaces(readTextFile('snapshot/index-sass.js'))
    expect(readCssFile('out/index-sass.css')).to.equalIgnoreSpaces(readCssFile('snapshot/index-sass.css'))
  })

  it('caching test', async function () {
    const options = useFixture('caching')

    writeTextFile('./index.sass', readTextFile('./index-v1.sass'))

    const ctx = await esbuild.context({
      ...options,
      entryPoints: ['./index.js'],
      outdir: './out',
      bundle: true,
      plugins: [sassPlugin()] // caching is enabled by default!
    })
    const result = await ctx.rebuild()

    expect(fs.readFileSync('./out/index.css', 'utf-8').replace(/\/\*.+\*\//g, '')).to.equalIgnoreSpaces(`
      body { font: 100% Helvetica, sans-serif; color: #333; }
    `)

    writeTextFile('./index.sass', readTextFile('./index-v1.sass'))
    await ctx.rebuild()
    expect(fs.readFileSync('./out/index.css', 'utf-8').replace(/\/\*.+\*\//g, '')).to.equalIgnoreSpaces(`
      body { font: 100% Helvetica, sans-serif; color: #333; }
    `)

    writeTextFile('./dependency.sass', readTextFile('./dependency-v1.sass'))
    writeTextFile('./index.sass', readTextFile('./index-v2.sass'))
    await ctx.rebuild()
    expect(fs.readFileSync('./out/index.css', 'utf-8').replace(/\/\*.+\*\//g, '')).to.equalIgnoreSpaces(`
      body { background-color: red; } 
      body { font: 99% "Times New Roman", serif; color: #666; }
    `)

    writeTextFile('./dependency.sass', readTextFile('./dependency-v2.sass'))
    await ctx.rebuild().catch(ignored => {})

    writeTextFile('./dependency.sass', readTextFile('./dependency-v3.sass'))
    await ctx.rebuild()
    expect(fs.readFileSync('./out/index.css', 'utf-8').replace(/\/\*.+\*\//g, '')).to.equalIgnoreSpaces(`
      body { background-color: blue; } 
      body { font: 99% "Times New Roman", serif; color: #666; }
    `)

    ctx.dispose()
  })

  it('allows to specify a nonce for the <style> tag', async function () {
    const options = useFixture('nonce')

    const ctx = await esbuild.context({
      ...options,
      entryPoints: ['./index.js'],
      outdir: './out',
      bundle: true,
      plugins: [
        sassPlugin({
          type: 'style',
          nonce: '12345'
        })
      ]
    })
    const result = await ctx.rebuild()

    expect(readTextFile('out/index.js')).to.equalIgnoreSpaces(readTextFile('snapshot.js'))
  })

  it('if nonce starts with window, process or globalThis it is treated as a variable (ubound)', async function () {
    const options = useFixture('nonce')

    await esbuild.build({
      ...options,
      entryPoints: ['./index.js'],
      outdir: './out',
      bundle: true,
      plugins: [
        sassPlugin({
          type: 'style',
          nonce: 'window.__esbuild_nonce__'
        })
      ],
      define: {'window.__esbuild_nonce__': '"12345"'}
    })

    expect(readTextFile('out/index.js')).to.equalIgnoreSpaces(readTextFile('snapshot.js'))
  })

})
