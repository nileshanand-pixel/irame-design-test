import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import fs from 'fs';

let isLocal = false;

try {
	isLocal = process.env.VITE_ENV === 'local';
} catch (error) {
	isLocal = false;
}

const config = {
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
};

if (isLocal) {
	config.server = {
		https: {
			key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
			cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem')),
		},
	};
}

export default defineConfig(config);
