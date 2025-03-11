import { Plugin, ResolvedConfig } from 'vite';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { parse } from 'es-module-lexer';
import * as resolve from 'enhanced-resolve';

interface PluginConfig {
    id: string;
    name: string;
    version: string;
    description?: string;
    icon?: string;
    internalPlugin: boolean;

    view?: {
        summary?: {
            entryPoint: string;
        };
        expand?: {
            entryPoint: string;
        };
    };

    background?: {
        entryPoint: string;
    };

    permissions?: Record<string, unknown>;

    assets?: {
        bundles?: string[];
        images?: string[];
        other?: string[];
    };

    settings?: Record<string, unknown>;
}

interface PluginOptions {
    configPath?: string;
    publicDir?: string;
    watchMode?: boolean;
}

export default function processPluginConf(options: PluginOptions = {}): Plugin {
    const configPath = options.configPath || './plugin-conf.json';
    const publicDir = options.publicDir || 'public';
    const watchMode = options.watchMode !== false; // Default to true

    let config: ResolvedConfig;
    let importedFiles = new Set<string>();
    let entryPoints: string[] = [];
    let isDevServer = false;

    return {
        name: 'vite-plugin-process-plugin-conf',

        configResolved(resolvedConfig) {
            config = resolvedConfig;
            isDevServer = resolvedConfig.command === 'serve';
        },

        buildStart() {
            // Process config in both development and build modes
            processConfig();
        },

        configureServer(server) {
            // Re-process config when files change in dev mode
            if (watchMode) {
                const pluginConfigPath = path.resolve(config.root, configPath);

                // Watch the entry points and their dependencies
                server.watcher.add(pluginConfigPath);

                server.watcher.on('change', (filePath) => {
                    // If the changed file is one we care about, update the config
                    if (filePath === pluginConfigPath ||
                        entryPoints.some(entry => filePath.includes(entry)) ||
                        (Array.from(importedFiles).some(file => filePath === file))) {
                        console.log(`File changed: ${filePath}, updating plugin-conf.json`);
                        processConfig();
                    }
                });
            }
        },

        // Handle bundle generation in build mode
        generateBundle(_, bundle) {
            if (!isDevServer) {
                // Read the config file
                const rootDir = config.root;
                const configFilePath = path.join(rootDir, configPath);

                if (!fs.existsSync(configFilePath)) {
                    return;
                }

                try {
                    const configContent = fs.readFileSync(configFilePath, 'utf-8');
                    const pluginConfig: PluginConfig = JSON.parse(configContent);

                    // Initialize or reset bundles array
                    if (!pluginConfig.assets) {
                        pluginConfig.assets = {};
                    }
                    if (!pluginConfig.assets.bundles) {
                        pluginConfig.assets.bundles = [];
                    } else {
                        // Clear existing bundles
                        pluginConfig.assets.bundles = [];
                    }

                    // Get all output bundles from Vite
                    const entryPoints = new Set(['summary', 'expand', 'background']);
                    const entryPointMap: Record<string, string> = {};
                    const sharedBundles = new Set<string>();

                    // First pass: identify entry points and shared bundles
                    Object.entries(bundle).forEach(([fileName, bundleInfo]) => {
                        if (bundleInfo.type === 'chunk' && fileName.endsWith('.js')) {
                            const name = bundleInfo.name || '';
                            const isEntry = 'isEntry' in bundleInfo ? bundleInfo.isEntry : false;

                            // If it's a named entry point, store the mapping
                            if (name && entryPoints.has(name) && isEntry) {
                                entryPointMap[name] = fileName;
                            }
                            // If it's not an entry point but a JS chunk, it's a shared bundle
                            else if (!isEntry) {
                                sharedBundles.add(fileName);
                            }

                            // Add all JS files to the bundles list
                            if (pluginConfig.assets && pluginConfig.assets.bundles) {
                                pluginConfig.assets.bundles.push(fileName);
                            }
                        }

                        // Also track CSS files
                        if (bundleInfo.type === 'asset' && fileName.endsWith('.css')) {
                            if (pluginConfig.assets && pluginConfig.assets.bundles) {
                                pluginConfig.assets.bundles.push(fileName);
                            }
                        }
                    });

                    // Re-order bundles to put shared bundles first for proper loading
                    if (pluginConfig.assets && pluginConfig.assets.bundles) {
                        const allBundles = [...pluginConfig.assets.bundles];
                        pluginConfig.assets.bundles = [
                            // Shared bundles first
                            ...Array.from(sharedBundles),
                            // Then entry points and other assets
                            ...allBundles.filter(bundle => !sharedBundles.has(bundle))
                        ];
                    }

                    // Update view entry points if they exist
                    if (pluginConfig.view) {
                        if (pluginConfig.view.summary && entryPointMap['summary']) {
                            pluginConfig.view.summary.entryPoint = entryPointMap['summary'];
                        }
                        if (pluginConfig.view.expand && entryPointMap['expand']) {
                            pluginConfig.view.expand.entryPoint = entryPointMap['expand'];
                        }
                    }

                    // Update background entry point if it exists
                    if (pluginConfig.background && entryPointMap['background']) {
                        pluginConfig.background.entryPoint = entryPointMap['background'];
                    }

                    // Write the updated config back to the file
                    fs.writeFileSync(configFilePath, JSON.stringify(pluginConfig, null, 2));
                    console.log(`Plugin configuration updated with bundle information at ${configPath}`);

                } catch (error) {
                    console.error(`Error updating bundle information in plugin-conf.json:`, error);
                }
            }
        }
    };

    // Function to process the plugin config
    function processConfig() {
        const rootDir = config.root;
        const configFilePath = path.join(rootDir, configPath);

        if (!fs.existsSync(configFilePath)) {
            console.error(`Error: ${configPath} not found. Please create this file first.`);
            return;
        }

        try {
            // Read the existing config file
            const configContent = fs.readFileSync(configFilePath, 'utf-8');
            const pluginConfig: PluginConfig = JSON.parse(configContent);

            // Reset imported files set and entry points
            importedFiles = new Set<string>();
            entryPoints = [];

            // Collect entry points for watching
            if (pluginConfig.view?.summary?.entryPoint) {
                entryPoints.push(pluginConfig.view.summary.entryPoint);
            }
            if (pluginConfig.view?.expand?.entryPoint) {
                entryPoints.push(pluginConfig.view.expand.entryPoint);
            }
            if (pluginConfig.background?.entryPoint) {
                entryPoints.push(pluginConfig.background.entryPoint);
            }

            // Validate and process view entry points
            if (pluginConfig.view) {
                if (pluginConfig.view.summary?.entryPoint) {
                    const summaryPath = path.join(rootDir, pluginConfig.view.summary.entryPoint);
                    if (fs.existsSync(summaryPath)) {
                        analyzeImports(summaryPath, rootDir);
                    } else {
                        console.warn(`Warning: Summary view entry point ${pluginConfig.view.summary.entryPoint} does not exist.`);
                    }
                }

                if (pluginConfig.view.expand?.entryPoint) {
                    const expandPath = path.join(rootDir, pluginConfig.view.expand.entryPoint);
                    if (fs.existsSync(expandPath)) {
                        analyzeImports(expandPath, rootDir);
                    } else {
                        console.warn(`Warning: Expand view entry point ${pluginConfig.view.expand.entryPoint} does not exist.`);
                    }
                }
            }

            // Validate and process background entry point
            if (pluginConfig.background?.entryPoint) {
                const backgroundPath = path.join(rootDir, pluginConfig.background.entryPoint);
                if (fs.existsSync(backgroundPath)) {
                    analyzeImports(backgroundPath, rootDir);
                } else {
                    console.warn(`Warning: Background entry point ${pluginConfig.background.entryPoint} does not exist.`);
                }
            }

            // Initialize assets if not exist
            if (!pluginConfig.assets) {
                pluginConfig.assets = {};
            }

            // Keep bundles array in dev mode, will be overwritten in build mode
            if (!pluginConfig.assets.bundles) {
                pluginConfig.assets.bundles = [];
            }

            // Convert imported files to relative paths and add to other assets
            if (!pluginConfig.assets.other) {
                pluginConfig.assets.other = [];
            }

            const relativeImportedFiles = Array.from(importedFiles).map(file =>
                path.relative(rootDir, file)
            );

            // Update the other assets (avoid duplicates)
            pluginConfig.assets.other = Array.from(
                new Set([...pluginConfig.assets.other, ...relativeImportedFiles])
            );

            // Add images from public directory to assets
            const publicDirPath = path.join(rootDir, publicDir);
            if (fs.existsSync(publicDirPath)) {
                if (!pluginConfig.assets.images) {
                    pluginConfig.assets.images = [];
                }

                const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
                try {
                    const publicImages = glob.sync('**/*', {
                        cwd: publicDirPath,
                        nodir: true
                    }).filter(file => {
                        const ext = path.extname(file).toLowerCase();
                        return imageExtensions.includes(ext);
                    }).map(file => `${publicDir}/${file}`);

                    // Update the images assets (avoid duplicates)
                    pluginConfig.assets.images = Array.from(
                        new Set([...pluginConfig.assets.images, ...publicImages])
                    );
                } catch (error) {
                    console.warn(`Warning: Error processing public directory images:`, error);
                }
            }

            // Write the updated config back to the file
            fs.writeFileSync(configFilePath, JSON.stringify(pluginConfig, null, 2));
            console.log(`Plugin configuration updated at ${configPath}`);

        } catch (error) {
            console.error(`Error processing plugin-conf.json:`, error);
        }
    }

    // Function to analyze imports recursively
    function analyzeImports(filePath: string, rootDir: string, visited = new Set<string>()) {
        if (visited.has(filePath)) {
            return;
        }

        visited.add(filePath);

        try {
            // Read file content
            const content = fs.readFileSync(filePath, 'utf-8');

            // Skip non-JS/TS files
            const ext = path.extname(filePath).toLowerCase();
            if (!['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(ext)) {
                importedFiles.add(filePath);
                return;
            }

            // Parse imports using es-module-lexer
            const [imports] = parse(content);

            // Add current file to imported files
            importedFiles.add(filePath);

            // Process each import
            for (const imp of imports) {
                const importPath = imp.n;
                if (!importPath || importPath.startsWith('node:') || importPath.startsWith('vite/') || importPath.startsWith('virtual:')) {
                    continue;
                }

                try {
                    // Use enhanced-resolve to find the actual file
                    const resolver = resolve.create.sync({
                        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.vue', '.css', '.scss', '.less'],
                        conditionNames: ['import', 'require', 'node', 'default'],
                        mainFields: ['browser', 'module', 'main'],
                    });

                    const resolvedPath = resolver(path.dirname(filePath), importPath);

                    if (resolvedPath && !resolvedPath.includes('node_modules')) {
                        // Recursively analyze imports in the resolved file
                        analyzeImports(resolvedPath, rootDir, visited);
                    }
                } catch (err) {
                    // Skip if import can't be resolved
                    console.warn(`Warning: Could not resolve import "${importPath}" in ${filePath}`);
                }
            }
        } catch (error) {
            console.warn(`Warning: Error analyzing imports in ${filePath}:`, error);
        }
    }
}