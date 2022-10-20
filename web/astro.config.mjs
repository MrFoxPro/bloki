import path from 'node:path'
import { defineConfig } from 'astro/config'

// import mdx from '@astrojs/mdx'
// import remarkFrontmatter from 'remark-frontmatter'
// import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import solidJs from '@astrojs/solid-js'
import solidSvg from 'vite-plugin-solid-svg'
import solidPlugin from 'vite-plugin-solid'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  output: 'static',
  outDir: '../dist/web',
  srcDir: '.',
  root: '.',
  trailingSlash: 'always',
  integrations: [solidJs()],
  vite: {
    clearScreen: true,
    plugins: [
      solidPlugin(),
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
    ],
    resolve: {
      alias: [
        {
          find: '@',
          replacement: path.resolve(__dirname, './'),
        },
      ],
    },
  },
})
