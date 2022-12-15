import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import vite_solid_svg from 'vite-plugin-solid-svg'
import vite_solid from 'vite-plugin-solid'
import { visualizer } from 'rollup-plugin-visualizer'
import vite_image_presets from 'vite-plugin-image-presets'
import vite_linaria from '@linaria/vite'
import compression from 'vite-plugin-compression'
import ssr from 'vite-plugin-ssr/plugin'

export default (/** @type import('vite').ConfigEnv */ { mode }) => {
   const dev = mode === 'development'
   const git = (/** @type {string} */ cmd) => `'${String(execSync(cmd)).trimEnd().replaceAll("'", '"')}'`
   const outDir = './dist'
   const __dirname = fileURLToPath(new URL('.', import.meta.url))

   /** @type import('vite').UserConfig */
   const config = {
      assetsInclude: [/\.mp4$/, /\.webm$/],
      clearScreen: true,
      appType: 'custom',
      root: __dirname,
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
               target: 'http://localhost:3001',
               changeOrigin: true,
            },
         },
      },
      plugins: [
         {
            enforce: 'post',
            ...vite_linaria({
               displayName: true,
               extensions: ['.js', '.ts', '.tsx'],
               babelOptions: {
                  presets: ['solid', '@babel/typescript'],
               },
            }),
         },
         vite_image_presets(),
         vite_solid({
            dev: dev,
            hot: dev,
            ssr: true,
         }),
         vite_solid_svg({ defaultAsComponent: true }),
         ssr({
            includeAssetsImportedByServer: true,
            prerender: {
               partial: true,
               // noExtraDir: true
            }
         }),
         !dev &&
         visualizer({
            open: false,
            filename: path.resolve(outDir, 'stats.html'),
            gzipSize: true,
         }),
         !dev &&
         compression({
            filter: /\.(js|mjs|json|css|html|woff2)$/i,
            verbose: false,
         }),
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
         outDir,
         modulePreload: {
            polyfill: false,
         },
         sourcemap: false,
         target: 'esnext',
         reportCompressedSize: false,
         minify: 'esbuild',
         emptyOutDir: true,
      },
      optimizeDeps: {
         esbuildOptions: {
            preserveSymlinks: true,
         },
      },
   }
   return config
}
