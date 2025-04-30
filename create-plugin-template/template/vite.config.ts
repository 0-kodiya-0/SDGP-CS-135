import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import processPluginConf from './lib/vite-plugin-process-plugin-conf';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    processPluginConf({
      configPath: './plugin-conf.json',
      publicDir: 'public',
      watchMode: true
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    // Disable generating an HTML file
    rollupOptions: {
      input: {
        // Define separate entry points
        'summary': resolve(__dirname, 'src/views/summary/index.ts'),
        'expand': resolve(__dirname, 'src/views/expand/index.ts'),
        'background': resolve(__dirname, 'src/scripts/background/index.ts'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/shared-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    },
    // Let Vite handle code splitting with its default algorithm
    // This will automatically extract common chunks
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
});