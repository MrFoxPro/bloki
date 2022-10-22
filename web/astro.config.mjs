import path from 'node:path'
import { execSync } from 'node:child_process'
import solid_astro from '@astrojs/solid-js'
import solid_svg from 'vite-plugin-solid-svg'
import solid from 'vite-plugin-solid'
import { visualizer } from 'rollup-plugin-visualizer'
import image_presets from 'vite-plugin-image-presets'
import cssnano from 'cssnano'

const git = (cmd) => `'${execSync(cmd).toString().trimEnd().replaceAll("'", '"')}'`
const dev = process.env.npm_lifecycle_event === 'dev'
const outDir = '../dist/web'

/**@type import('astro/config').AstroUserConfig */
const config = {
   output: 'static',
   outDir: '../dist/web',
   srcDir: './',
   root: './',
   trailingSlash: 'ignore',
   integrations: [solid_astro()],
   build: {
      format: 'file',
   },
   vite: {
      clearScreen: true,
      define: {
         GIT_COMMIT_DATE: git('git log -1 --format=%cI'),
         GIT_BRANCH_NAME: git('git rev-parse --abbrev-ref HEAD'),
         GIT_COMMIT_HASH: git('git rev-parse --short HEAD'),
         GIT_LAST_COMMIT_MESSAGE: git('git show -s --format=%s'),
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
      plugins: [
         solid(),
         solid_svg(),
         image_presets(),
         !dev &&
            visualizer({
               open: false,
               filename: path.resolve(outDir, 'stats.html'),
               gzipSize: true,
            }),
         // Not using compression as CF pages don't suppord precompressed assets
         // https://community.cloudflare.com/t/pre-compressed-assets-in-pages/300028
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
            plugins: !dev ? [cssnano()] : [],
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
export default config
