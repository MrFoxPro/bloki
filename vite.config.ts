import path from 'path';

import { ConfigEnv, UserConfigExport } from 'vite';
import solid from 'vite-plugin-solid';

export default ({ mode }: ConfigEnv) => {
   const dev = mode === 'development';
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
