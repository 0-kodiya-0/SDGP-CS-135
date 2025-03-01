import fs from 'fs';
import path from 'path';
import { PluginConfig, PluginEntryPoint, PluginConfigFile } from './types';

export const pluginsDir = path.resolve(__dirname, '..', 'src', 'plugin');

/**
 * Function to recursively find all plugin.conf.json files
 */
export function findPluginConfigs(dir: string): string[] {
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

/**
 * Function to convert file path to output path with proper extension
 */
export function convertToOutputPath(
    pluginRelativePath: string,
    filePath: string
): string {
    const dirName = path.dirname(filePath);
    const baseName = path.basename(filePath, path.extname(filePath));

    // Always use .js extension for output regardless of input extension
    return path.join('plugin', pluginRelativePath, dirName, `${baseName}.js`);
}

/**
 * Function to parse plugin config and extract entry points
 */
export function getPluginEntryPoints(configPath: string): PluginEntryPoint[] {
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

/**
 * Get all plugin entries and config files in one operation
 */
export function discoverPlugins(): {
    pluginEntries: PluginEntryPoint[];
    configFiles: PluginConfigFile[]
} {
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

    return { pluginEntries, configFiles };
}