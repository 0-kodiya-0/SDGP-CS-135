import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import { PluginConfig, PluginConfigFile } from './types';

/**
 * Custom plugin to copy plugin.conf.json files and update entry point paths
 */
export function copyPluginConfigsPlugin(configFiles: PluginConfigFile[]): Plugin {
    return {
        name: 'copy-plugin-configs',
        writeBundle: {
            sequential: true,
            order: 'post',
            handler: async () => {
                const outDir = path.resolve(__dirname, 'dist', 'assets', 'plugin');

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

/**
 * Plugin to ensure proper handling of react and typescript files
 */
export function ensureProperExportsPlugin(): Plugin {
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