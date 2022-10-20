import path from 'node:path'
import { defineConfig } from 'astro/config'

// import mdx from '@astrojs/mdx'
// import remarkFrontmatter from 'remark-frontmatter'
// import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import solidJs from '@astrojs/solid-js'

export default defineConfig({
  output: 'static',
  outDir: '../dist/web',
  srcDir: '.',
  root: '.',
  integrations: [solidJs()],
  build: {
    format: 'file',
  },
  vite: {
    clearScreen: true,
    plugins: [],
    resolve: {
      alias: [
        {
          find: '@',
          replacement: './',
        },
      ],
    },
  },
})
