import path from 'node:path'
import fs from 'node:fs/promises'
import { execSync } from 'node:child_process'
import { defineConfig } from 'astro/config'
import astro_relative_404 from 'astro-relative-404'
import astro_solid from '@astrojs/solid-js'
import vite_solid_svg from 'vite-plugin-solid-svg'
import vite_solid from 'vite-plugin-solid'
import astro_svg from '@foxpro/astro-svg-components'
import { visualizer } from 'rollup-plugin-visualizer'
import vite_image_presets from 'vite-plugin-image-presets'
import astro_unocss from 'unocss/astro'

const dev = process.env.npm_lifecycle_event === 'dev'
const git = (/** @type {string} */ cmd) => `'${String(execSync(cmd)).trimEnd().replaceAll("'", '"')}'`
const outDir = '../dist/web'

export default defineConfig({
   output: 'static',
   outDir: '../dist/web',
   site: 'https://bloki.app',
   srcDir: '.',
   root: '.',
   trailingSlash: 'ignore',
   integrations: [
      astro_unocss({
         envMode: dev ? 'dev' : 'build',
         postcss: false,
         mode: 'global',
         inspector: dev,
         preflights: [
            {
               getCSS: () => fs.readFile('./styles/fonts.css', 'utf8'),
            },
         ],
      }),
      astro_solid(),
      astro_relative_404(),
      astro_svg(),
   ],
   server: {
      host: '0.0.0.0',
      port: 3000,
   },
   build: {
      format: 'file',
   },
   vite: {
      assetsInclude: [/\.mp4$/, /\.webm$/],
      clearScreen: true,
      define: {
         GIT_COMMIT_DATE: git('git log -1 --format=%cI'),
         GIT_BRANCH_NAME: git('git rev-parse --abbrev-ref HEAD'),
         GIT_COMMIT_HASH: git('git rev-parse --short HEAD'),
         GIT_LAST_COMMIT_MESSAGE: git('git show -s --format=%s'),
      },
      server: {
         proxy: {
            '/api': {
               target: 'http://localhost:3001',
               changeOrigin: true,
            },
         },
      },
      plugins: [
         vite_solid({ dev: false, hot: false }),
         vite_solid_svg(),
         vite_image_presets(),
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
               replacement: path.resolve('.'),
            },
         ],
      },
      css: {
         modules: false,
      },
      build: {
         modulePreload: {
            polyfill: false,
         },
         sourcemap: false,
         target: 'esnext',
         reportCompressedSize: false,
         minify: 'esbuild',
         emptyOutDir: true,
         cssCodeSplit: true,
      },
   },
})
