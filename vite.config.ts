import path from 'path';
import { execSync } from 'child_process';
import { ConfigEnv, UserConfigExport } from 'vite';
import solid from 'vite-plugin-solid';

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
      plugins: [
         solid({
            hot: dev,
            dev: dev,
            ssr: false,
         }),
      ],
      build: {
         polyfillDynamicImport: false,
         sourcemap: false,
         outDir: './dist',
         reportCompressedSize: true,
         minify: 'terser',
         // target: 'esnext',
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
