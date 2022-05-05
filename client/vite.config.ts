import path from 'path';
import { execSync } from 'child_process';
import { ConfigEnv, UserConfig } from 'vite';
import solid from 'vite-plugin-solid';
import viteCompression from 'vite-plugin-compression';
import solidSvg from "vite-plugin-solid-svg";
import visualizer from 'rollup-plugin-visualizer';
import cssnanoPlugin from 'cssnano';
// https://github.com/ElMassimo/vite-plugin-image-presets
import imagePresets from 'vite-plugin-image-presets';
import inlineCssModules from './vite-plugin-inline-css-modules';

export default async ({ mode }: ConfigEnv) => {
	const dev = mode === 'development';

	const commitDate = execSync('git log -1 --format=%cI').toString().trimEnd();
	const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trimEnd();
	const commitHash = execSync('git rev-parse HEAD').toString().trimEnd();
	const lastCommitMessage = execSync('git show -s --format=%s').toString().trimEnd();

	process.env.VITE_GIT_COMMIT_DATE = commitDate;
	process.env.VITE_GIT_BRANCH_NAME = branchName;
	process.env.VITE_GIT_COMMIT_HASH = commitHash;
	process.env.VITE_GIT_LAST_COMMIT_MESSAGE = lastCommitMessage;

	const config: UserConfig = {
		base: dev ? './' : '/',
		assetsInclude: ['*.gltf', /.gltf/],
		clearScreen: false,
		optimizeDeps: {},
		server: {
			host: '0.0.0.0',
			port: 3000,
			proxy: {
				'/api': {
					target: 'http://localhost:3006',
					changeOrigin: true,
				},
			}
		},
		plugins: [
			inlineCssModules({
				preprocessor: 'scss'
			}),
			solid({
				hot: dev,
				dev: dev,
				ssr: false,
			}),
			solidSvg(),
			imagePresets(),
			viteCompression({
				disable: dev,
				filter: /\.(js|mjs|json|css|html|woff2)$/i
			}),
			!dev && visualizer({
				open: false,
				filename: './dist/stats.html',
				gzipSize: true,
			}),
		],
		build: {
			polyfillDynamicImport: false,
			sourcemap: false,
			target: 'esnext',
			reportCompressedSize: true,
			outDir: './dist',
			rollupOptions: {
				output: {
					manualChunks: {
						solid: ['solid-js'],
						graphql: ['graphql', 'graphql-tag', 'graphql-request']
					},
					entryFileNames: '[name].mjs',
					chunkFileNames: '[name].mjs',
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
			cssCodeSplit: true,
		},
		css: {
			modules: {
				// https://github.com/madyankin/postcss-modules
				// generateScopedName: '[local]-[hash:base64:2]',
				generateScopedName: '[local]',
				localsConvention: 'camelCaseOnly',
				scopeBehaviour: 'local',
			},
			postcss: {
				plugins: []
			},
			preprocessorOptions: {
				scss: {
					includePaths: ['./styles']
				}
			}
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
	if (!dev) {
		// @ts-ignore
		config.css?.postcss.plugins.push(cssnanoPlugin({
			preset: 'advanced'
		}));
	}
	return config;
};