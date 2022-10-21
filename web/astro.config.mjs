import path from 'node:path'
import { execSync } from 'node:child_process'

import solid_astro from '@astrojs/solid-js'
import solid_svg from 'vite-plugin-solid-svg'
import solid from 'vite-plugin-solid'
import compression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'
import cssnano from 'cssnano'
import image_presets from 'vite-plugin-image-presets'

const git = (cmd) => `'${execSync(cmd).toString().trimEnd()}'`
const GIT_COMMIT_DATE = git('git log -1 --format=%cI')
const GIT_BRANCH_NAME = git('git rev-parse --abbrev-ref HEAD')
const GIT_COMMIT_HASH = git('git rev-parse --short HEAD')
const GIT_LAST_COMMIT_MESSAGE = git('git show -s --format=%s')

const dev = process.env.npm_lifecycle_event === 'dev'
console.log('dev mode:', dev)
const outDir = '../dist/web'

/**@type import('astro/config').AstroUserConfig */
const config = {
   output: 'static',
   outDir: '../dist/web',
   srcDir: '.',
   root: '.',
   trailingSlash: 'ignore',
   integrations: [solid_astro()],
   build: {
      format: 'file',
   },
   vite: {
      define: {
         GIT_COMMIT_DATE,
         GIT_BRANCH_NAME,
         GIT_COMMIT_HASH,
         GIT_LAST_COMMIT_MESSAGE,
      },
      server: {
         host: '0.0.0.0',
         port: 3000,
         proxy: {
            '/api': {
               target: 'http://localhost:5007',
               changeOrigin: true,
            },
         },
      },
      clearScreen: true,
      plugins: [
         solid(),
         solid_svg(),
         image_presets(),
         !dev &&
            compression({
               filter: /\.(js|mjs|json|css|html|woff2)$/i,
               verbose: false,
            }),
         !dev &&
            visualizer({
               open: false,
               filename: path.resolve(outDir, 'stats.html'),
               gzipSize: true,
            }),
      ],
      resolve: {
         alias: [
            {
               find: '@',
               replacement: path.resolve('./'),
            },
         ],
      },
      css: {
         modules: false,
         postcss: {
            plugins: [],
         },
      },
      build: {
         polyfillModulePreload: false,
         sourcemap: false,
         target: 'esnext',
         reportCompressedSize: false,
         minify: 'esbuild',
         emptyOutDir: true,
         cssCodeSplit: true,
      },
   },
}
if (!dev) {
   // @ts-ignore
   config.vite.css.postcss.plugins.push(cssnano())
}
export default config
