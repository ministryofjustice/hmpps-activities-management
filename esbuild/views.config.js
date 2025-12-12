const { copy } = require('esbuild-plugin-copy')
const esbuild = require('esbuild')
const { globSync } = require('node:fs')

/**
 * Build typescript application into CommonJS
 * @type {BuildStep}
 */
const copyViews = buildConfig => {
  return esbuild.build({
    entryPoints: globSync(buildConfig.app.entryPoints),
    outdir: buildConfig.app.outDir,
    bundle: false,
    sourcemap: false,
    platform: 'node',
    format: 'cjs',
    plugins: [
      copy({
        resolveFrom: 'cwd',
        assets: buildConfig.app.copy,
      }),
    ],
  })
}

/**
 * @param {BuildConfig} buildConfig
 * @returns {Promise}
 */
module.exports = buildConfig => {
  process.stderr.write('\u{1b}[1m\u{2728} Copying views...\u{1b}[0m\n')

  return copyViews(buildConfig)
}
