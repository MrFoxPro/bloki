import path from 'path'
import { execSync } from 'child_process'
import type { ConfigEnv, UserConfig } from 'vite'
import solid from 'vite-plugin-solid'
import viteCompression from 'vite-plugin-compression'
import solidSvg from 'vite-plugin-solid-svg'
import { visualizer } from 'rollup-plugin-visualizer'
import cssnanoPlugin from 'cssnano'
// https://github.com/ElMassimo/vite-plugin-image-presets
import imagePresets from 'vite-plugin-image-presets'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
// import solidSsgPages from 'vite-solid-ssg-pages'

declare global {
   const GIT_COMMIT_DATE: string
   const GIT_LAST_COMMIT_MESSAGE: string
   const GIT_BRANCH_NAME: string
   const GIT_COMMIT_HASH: string
}

export default async ({ mode }: ConfigEnv) => {
   const dev = mode === 'development'

   const readGit = (cmd: string) => `'${execSync(cmd).toString().trimEnd()}'`
   const GIT_COMMIT_DATE = readGit('git log -1 --format=%cI')
   const GIT_BRANCH_NAME = readGit('git rev-parse --abbrev-ref HEAD')
   const GIT_COMMIT_HASH = readGit('git rev-parse --short HEAD')
   const GIT_LAST_COMMIT_MESSAGE = readGit('git show -s --format=%s')

   const outDir = '../dist/web'
   const config: UserConfig = {
      base: dev ? './' : '/',
      publicDir: false,
      clearScreen: true,
      appType: 'spa',
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
      ssr: {
         noExternal: ['solid-js', 'solid-js/web'],
      },
      worker: {
         format: 'es',
      },
      plugins: [
         solidSvg({
            defaultExport: 'component',
            svgo: {
               enabled: true,
               svgoConfig: {
                  js2svg: {
                     indent: 2, // string with spaces or number of spaces. 4 by default
                     pretty: true, // boolean, false by default
                  },
                  plugins: [
                     'preset-default',
                     'prefixIds',
                     {
                        name: 'sortAttrs',
                        params: {
                           xmlnsOrder: 'alphabetical',
                        },
                     },
                  ],
               },
            },
         }),
         {
            ...mdx({
               jsx: true,
               jsxImportSource: 'solid-js',
               providerImportSource: 'solid-mdx',
               remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
            }),
            enforce: 'pre',
         },
         solid({
            hot: dev,
            dev: dev,
            extensions: ['.md'],
            ssr: true,
         }),
         // imagePresets(),
         !dev &&
            viteCompression({
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
      build: {
         outDir,
         polyfillModulePreload: false,
         sourcemap: false,
         target: 'esnext',
         reportCompressedSize: false,
         minify: 'esbuild',
         emptyOutDir: true,
         cssCodeSplit: true,
         rollupOptions: {
            input: {
               app: './index.html',
            },
            output: {
               manualChunks: {
                  // solid: ['solid-js'],
                  // graphql: ['graphql-tag', 'graphql-request']
               },
               validate: !dev,
               // entryFileNames: '[name].js',
               // chunkFileNames: '[name].js',
               // assetFileNames: 'assets/[name].[ext]',
            },
         },
      },
      css: {
         modules: false,
         postcss: {
            plugins: [],
         },
      },
      resolve: {
         alias: [
            {
               find: '@',
               replacement: path.resolve(__dirname, './'),
            },
         ],
      },
   }
   if (!dev) {
      // @ts-ignore
      config.css.postcss.plugins.push(cssnanoPlugin())
   }
   return config
}
