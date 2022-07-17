import path from 'path';
import { execSync } from 'child_process';
import { ConfigEnv, UserConfig } from 'vite';
import solid from 'vite-plugin-solid';
import viteCompression from 'vite-plugin-compression';
import solidSvg from 'vite-plugin-solid-svg';
import visualizer from 'rollup-plugin-visualizer';
import cssnanoPlugin from 'cssnano';
// https://github.com/ElMassimo/vite-plugin-image-presets
import imagePresets from 'vite-plugin-image-presets';

export default async ({ mode }: ConfigEnv) => {
   const dev = mode === 'development';

   const commitDate = execSync('git log -1 --format=%cI').toString().trimEnd();
   const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trimEnd();
   const commitHash = execSync('git rev-parse --short HEAD').toString().trimEnd();
   const lastCommitMessage = execSync('git show -s --format=%s').toString().trimEnd();

   process.env.VITE_GIT_COMMIT_DATE = commitDate;
   process.env.VITE_GIT_BRANCH_NAME = branchName;
   process.env.VITE_GIT_COMMIT_HASH = commitHash;
   process.env.VITE_GIT_LAST_COMMIT_MESSAGE = lastCommitMessage;

   const outDir = '../dist/client';
   const config: UserConfig = {
      base: dev ? './' : '/',
      assetsInclude: ['*.gltf', /.gltf/],
      clearScreen: false,
      // optimizeDeps: {},
      server: {
         host: '0.0.0.0',
         port: 3000,
         proxy: {
            '/api': {
               target: 'http://localhost:5007',
               changeOrigin: true,
            }
         }
      },
      plugins: [
         solidSvg(),
         solid({
            hot: dev,
            dev: dev,
            ssr: false
         }),
         imagePresets(),
         !dev &&
            viteCompression({
               filter: /\.(js|mjs|json|css|html|woff2)$/i
            }),
         !dev &&
            visualizer({
               open: false,
               filename: path.resolve(outDir, 'stats.html'),
               gzipSize: true
            })
      ],
      build: {
         polyfillDynamicImport: false,
         sourcemap: false,
         target: 'esnext',
         reportCompressedSize: true,
         outDir: outDir,
         rollupOptions: {
            output: {
               manualChunks: {
                  solid: ['solid-js'],
                  graphql: ['graphql', 'graphql-tag', 'graphql-request']
               },
               entryFileNames: '[name].js',
               chunkFileNames: '[name].js',
               assetFileNames: 'assets/[name].[ext]'
            }
         },
         minify: 'esbuild',
         // terserOptions: {
         // 	compress: true,
         // 	ecma: 2020,
         // 	sourceMap: false,
         // 	module: true,
         // 	mangle: true,
         // 	toplevel: true
         // },
         emptyOutDir: true,
         cssCodeSplit: true
      },
      css: {
         modules: false,
         // modules: {
         //    // https://github.com/madyankin/postcss-modules
         //    // generateScopedName: '[local]-[hash:base64:2]',
         //    generateScopedName: '[local]',
         //    localsConvention: 'camelCaseOnly',
         //    scopeBehaviour: 'local',
         // },
         postcss: {
            plugins: []
         }
         // preprocessorOptions: {
         //    scss: {
         //       includePaths: ['./styles']
         //    }
         // }
      },
      resolve: {
         alias: [
            {
               find: '@',
               replacement: path.resolve(__dirname, './')
            }
         ]
      }
   };
   // if (!dev) {
   // @ts-ignore
   config.css.postcss.plugins.push(cssnanoPlugin());
   // }
   return config;
};
