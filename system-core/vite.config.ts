import { defineConfig, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

// Import our modularized plugin system
import { discoverPlugins } from './build/pluginDiscovery';
import { copyPluginConfigsPlugin, ensureProperExportsPlugin } from './build/vitePlugins';

// Discover all plugins and their entry points
const { pluginEntries, configFiles } = discoverPlugins();

export default defineConfig((): UserConfig => {
  // Create input object for rollup
  const input: Record<string, string> = {
    main: resolve(__dirname, 'index.html')
  };

  // Add all plugin entries to the input
  pluginEntries.forEach(entry => {
    input[`${entry.pluginId}-${entry.type}`] = entry.entryPath;
  });

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
      ensureProperExportsPlugin(),
      copyPluginConfigsPlugin(configFiles),
      tailwindcss()
    ],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      // Add sourcemaps for easier debugging
      sourcemap: true,
      rollupOptions: {
        input,
        output: {
          // Ensure files maintain their paths within assets directory
          entryFileNames: (chunkInfo) => {
            // For plugin entries, use the preserved path structure inside assets
            const matchingEntry = pluginEntries.find(entry =>
              chunkInfo.name === `${entry.pluginId}-${entry.type}`
            );

            if (matchingEntry) {
              return `assets/${matchingEntry.outputPath}`;
            }

            // Default output for other chunks
            return 'assets/[name]-[hash].js';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          // Preserve the module format
          format: 'es'
        },
        // Add preserveEntrySignatures to ensure exports are preserved
        preserveEntrySignatures: 'strict'
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      },
      // Ensure .tsx and .jsx files are properly resolved
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
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