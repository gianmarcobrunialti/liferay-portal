import react from '@vitejs/plugin-react-swc';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({command}) => ({
	build: {
		assetsDir: 'static',
		outDir: 'build',
		rollupOptions: {
			external: ['@liferay/oauth2-provider-web/client'],
			output: {
				assetFileNames: 'static/[name].[hash][extname]',
				chunkFileNames: 'static/[name].[hash].js',
				entryFileNames: 'static/[name].[hash].js',
			},
		},
	},
	optimizeDeps: {
		exclude: ['@liferay/oauth2-provider-web/client'],
	},
	plugins: [react()],
	resolve: {
		alias: {
			...(command === 'serve'
				? {
						'@liferay/oauth2-provider-web/client': path.resolve(
							__dirname,
							'./dev-stubs/oauth2-stub.ts'
						),
				  }
				: {}),
			'~': path.resolve(__dirname, './src/'),
		},
	},
	server: {
		port: 3001,
	},
}));
