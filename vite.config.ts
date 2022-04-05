import path from 'path';
import { execSync } from 'child_process';
import { ConfigEnv, Terser, UserConfigExport } from 'vite';
import solid from 'vite-plugin-solid';
import viteCompression from 'vite-plugin-compression';
import solidSvg from "vite-plugin-solid-svg";

export default ({ mode }: ConfigEnv) => {
   const dev = mode === 'development';

   const commitDate = execSync('git log -1 --format=%cI').toString().trimEnd();
   const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trimEnd();
   const commitHash = execSync('git rev-parse HEAD').toString().trimEnd();
   const lastCommitMessage = execSync('git show -s --format=%s').toString().trimEnd();

   process.env.VITE_GIT_COMMIT_DATE = commitDate;
   process.env.VITE_GIT_BRANCH_NAME = branchName;
   process.env.VITE_GIT_COMMIT_HASH = commitHash;
   process.env.VITE_GIT_LAST_COMMIT_MESSAGE = lastCommitMessage;

   const config: UserConfigExport = {
      base: dev ? './' : '/',
      assetsInclude: ['*.gltf', /.gltf/],
      server: {
         host: true,
      },
      plugins: [
         solid({
            hot: false,
            dev: dev,
            ssr: false,
         }),
         solidSvg(),
         viteCompression({
            disable: dev,
            filter: /\.(js|mjs|json|css|html|woff2)$/i
         }),
      ],
      build: {
         polyfillDynamicImport: false,
         sourcemap: false,
         target: 'esnext',
         outDir: './static',
         reportCompressedSize: true,
         minify: 'terser',
         terserOptions: {
            compress: true,
            ecma: 2020,
            sourceMap: false,
            keep_classnames: true,
            safari10: false,
         },
      },
      css: {
         modules: {
            generateScopedName: '[local]-[hash:base64:2]',
            localsConvention: 'camelCaseOnly',
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
   };
   return config;
};
