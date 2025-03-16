import { defineConfig, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig((): UserConfig => {
  return {
    plugins: [
      react({
        // Specify options for react plugin to ensure proper handling of JSX/TSX
        jsxRuntime: 'automatic',
        babel: {
          // Add any babel plugins or presets needed
          presets: [],
          plugins: [],
          // Ensure we're not losing exports during transformation
          assumptions: {
            noDocumentAll: true
          }
        }
      }),
      tailwindcss()
    ],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      // Add sourcemaps for easier debugging
      sourcemap: true
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      },
      // Ensure .tsx and .jsx files are properly resolved
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    },
    server: {
      proxy: {
        '/api/v1': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        }
      }
    },
    esbuild: {
      // Ensure JSX is properly transformed
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      // Preserve JSX in output
      jsx: 'transform'
    }
  };
});