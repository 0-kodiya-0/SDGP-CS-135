import { defineConfig, UserConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

interface PluginConfig {
  id?: string;
  name?: string;
  description?: string;
  version?: string;
  ui?: {
    entryPoint: string;
  };
  background?: {
    entryPoint: string;
  };
  worker?: {
    entryPoint: string;
  };
  settings?: Record<string, any>;
}

interface PluginEntryPoint {
  pluginId: string;
  type: 'ui' | 'background' | 'worker';
  entryPath: string;
  outputPath: string;
  originalPath: string;
}

interface PluginConfigFile {
  configPath: string;
  relativePath: string;
}

// Function to recursively find all plugin.conf.json files
function findPluginConfigs(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively search subdirectories
      results = results.concat(findPluginConfigs(filePath));
    } else if (file === 'plugin.conf.json') {
      results.push(filePath);
    }
  }

  return results;
}

// Function to convert file path to output path with proper extension
function convertToOutputPath(
  pluginRelativePath: string,
  filePath: string
): string {
  const dirName = path.dirname(filePath);
  const baseName = path.basename(filePath, path.extname(filePath));

  // Always use .js extension for output regardless of input extension
  return path.join('plugin', pluginRelativePath, dirName, `${baseName}.js`);
}

// Function to parse plugin config and extract entry points
function getPluginEntryPoints(configPath: string): PluginEntryPoint[] {
  const configDir = path.dirname(configPath);
  const pluginRelativePath = path.relative(pluginsDir, configDir);
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const config: PluginConfig = JSON.parse(configContent);
  const entries: PluginEntryPoint[] = [];

  const pluginId = config.id || path.basename(configDir);

  // Process UI entry point if exists
  if (config.ui && config.ui.entryPoint) {
    const originalPath = config.ui.entryPoint;
    const entryPath = path.join(configDir, originalPath);
    const entryRelative = path.relative(process.cwd(), entryPath);
    // Convert to output path with proper extension
    const outputPath = convertToOutputPath(pluginRelativePath, originalPath);

    entries.push({
      pluginId,
      type: 'ui',
      entryPath: entryRelative,
      outputPath,
      originalPath
    });
  }

  // Process background entry point if exists
  if (config.background && config.background.entryPoint) {
    const originalPath = config.background.entryPoint;
    const entryPath = path.join(configDir, originalPath);
    const entryRelative = path.relative(process.cwd(), entryPath);
    // Convert to output path with proper extension
    const outputPath = convertToOutputPath(pluginRelativePath, originalPath);

    entries.push({
      pluginId,
      type: 'background',
      entryPath: entryRelative,
      outputPath,
      originalPath
    });
  }

  // Process worker entry point if exists
  if (config.worker && config.worker.entryPoint) {
    const originalPath = config.worker.entryPoint;
    const entryPath = path.join(configDir, originalPath);
    const entryRelative = path.relative(process.cwd(), entryPath);
    // Convert to output path with proper extension
    const outputPath = convertToOutputPath(pluginRelativePath, originalPath);

    entries.push({
      pluginId,
      type: 'worker',
      entryPath: entryRelative,
      outputPath,
      originalPath
    });
  }

  return entries;
}

// Get all plugin entry points
const pluginsDir = resolve(__dirname, 'src', 'plugin');
const pluginConfigs = findPluginConfigs(pluginsDir);
const pluginEntries: PluginEntryPoint[] = [];
const configFiles: PluginConfigFile[] = [];

for (const configPath of pluginConfigs) {
  const entries = getPluginEntryPoints(configPath);
  pluginEntries.push(...entries);

  // Store config file info for copying later
  const relativePath = path.relative(pluginsDir, path.dirname(configPath));
  configFiles.push({
    configPath,
    relativePath
  });
}

console.log('Found plugin entry points:', pluginEntries.length);

// Custom plugin to copy plugin.conf.json files and update entry point paths
function copyPluginConfigsPlugin(): Plugin {
  return {
    name: 'copy-plugin-configs',
    writeBundle: {
      sequential: true,
      order: 'post',
      handler: async () => {
        const outDir = resolve(__dirname, 'dist', 'assets', 'plugin');

        // Ensure the output directory exists
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }

        // Copy each plugin config file and update entry points
        for (const configFile of configFiles) {
          const targetDir = path.join(outDir, configFile.relativePath);
          const targetFile = path.join(targetDir, 'plugin.conf.json');

          // Ensure target directory exists
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }

          // Read the original config file
          const configContent = fs.readFileSync(configFile.configPath, 'utf-8');
          const config: PluginConfig = JSON.parse(configContent);

          // Update the entry points in the config to use .js extension
          if (config.ui && config.ui.entryPoint) {
            const originalPath = config.ui.entryPoint;
            const dirName = path.dirname(originalPath);
            const baseName = path.basename(originalPath, path.extname(originalPath));
            config.ui.entryPoint = path.join(dirName, `${baseName}.js`);
          }

          if (config.background && config.background.entryPoint) {
            const originalPath = config.background.entryPoint;
            const dirName = path.dirname(originalPath);
            const baseName = path.basename(originalPath, path.extname(originalPath));
            config.background.entryPoint = path.join(dirName, `${baseName}.js`);
          }

          if (config.worker && config.worker.entryPoint) {
            const originalPath = config.worker.entryPoint;
            const dirName = path.dirname(originalPath);
            const baseName = path.basename(originalPath, path.extname(originalPath));
            config.worker.entryPoint = path.join(dirName, `${baseName}.js`);
          }

          // Write the updated config file
          fs.writeFileSync(targetFile, JSON.stringify(config, null, 2));
          console.log(`Created modified ${targetFile} with updated extensions`);
        }
      }
    }
  };
}

// Plugin to ensure proper handling of react and typescript files
function ensureProperExportsPlugin(): Plugin {
  return {
    name: 'ensure-proper-exports',
    enforce: 'pre',
    transform(id) {
      // Only process TypeScript React files
      if (!/\.(tsx|jsx)$/.test(id)) {
        return null;
      }

      // Add debug logs to help diagnose issues
      console.log(`Processing file: ${id}`);

      return null; // Let Vite's default processors handle the transformation
    }
  };
}

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
      copyPluginConfigsPlugin(),
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