import { defineConfig, UserConfig } from 'vite';
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
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    // Don't create separate CSS files
    cssCodeSplit: false,
    // Use lib mode for better control over output
    lib: {
      entry: {
        'background': resolve(__dirname, 'src/background/index.ts'),
        'summary': resolve(__dirname, 'src/views/summary/index.tsx'),
        'expand': resolve(__dirname, 'src/views/expand/index.tsx')
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}/index.js`
    },
    rollupOptions: {
      // Make sure external dependencies are also bundled
      external: [],
      output: {
        // Prevent code-splitting
        chunkFileNames: () => {
          throw new Error('Code splitting is not allowed');
        },
        // Put assets in the right location
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && /\.css$/i.test(assetInfo.name)) {
            return 'assets/styles/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    },
    // Ensure all dependencies are bundled
    commonjsOptions: {
      include: [/node_modules/],
    },
    // Optimize for size but keep code readable
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    }
  },
} as UserConfig);