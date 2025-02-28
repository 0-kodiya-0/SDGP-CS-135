// scripts/build.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import typescript from 'typescript';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple TypeScript compiler
function transpileTypeScript(filePath, outputPath) {
    console.log(`Transpiling: ${filePath} -> ${outputPath}`);

    try {
        // Read TypeScript file
        const source = fs.readFileSync(filePath, 'utf8');

        // Transpile to JavaScript
        const result = typescript.transpileModule(source, {
            compilerOptions: {
                module: typescript.ModuleKind.ESNext,
                target: typescript.ScriptTarget.ES2020,
                jsx: typescript.JsxEmit.React,
                esModuleInterop: true,
            }
        });

        // Ensure the directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Write JavaScript file
        fs.writeFileSync(outputPath, result.outputText);
        return true;
    } catch (error) {
        console.error(`Error transpiling ${filePath}:`, error);
        return false;
    }
}

// Copy plugin files for production
function copyPlugins() {
    const pluginDir = path.resolve(__dirname, '../src/plugin');
    const publicPluginDir = path.resolve(__dirname, '../public/plugin');

    // Find all plugin directories (excluding 'types')
    const pluginDirs = fs.readdirSync(pluginDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && dirent.name !== 'types')
        .map(dirent => dirent.name);

    console.log(`Found plugin directories:`, pluginDirs);

    // Process each plugin
    for (const pluginId of pluginDirs) {
        console.log(`Processing plugin: ${pluginId}`);

        // Get plugin configuration
        const configPath = path.join(pluginDir, pluginId, 'plugin.conf.json');

        if (fs.existsSync(configPath)) {
            // Read plugin configuration
            const configContent = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configContent);

            // Ensure the plugin directory exists in public
            const publicPluginPath = path.resolve(publicPluginDir, pluginId);
            fs.mkdirSync(publicPluginPath, { recursive: true });

            // Copy the configuration file as is
            fs.copyFileSync(configPath, path.join(publicPluginPath, 'plugin.conf.json'));
            console.log(`Copied plugin.conf.json for ${pluginId}`);

            // Get UI entry point file
            const uiEntryPoint = config.ui.entryPoint;
            const uiSrcPath = path.join(pluginDir, pluginId, uiEntryPoint);

            if (fs.existsSync(uiSrcPath)) {
                // Create the output path, preserving the original structure
                const uiDestPath = path.join(publicPluginPath,
                    uiEntryPoint.replace(/\.tsx?$/, '.js'));

                // Create necessary subdirectories
                const uiDestDir = path.dirname(uiDestPath);
                if (!fs.existsSync(uiDestDir)) {
                    fs.mkdirSync(uiDestDir, { recursive: true });
                }

                // Transpile the UI file
                transpileTypeScript(uiSrcPath, uiDestPath);
                console.log(`Processed UI file: ${uiEntryPoint}`);
            } else {
                console.error(`Could not find UI file: ${uiSrcPath}`);
            }

            // Get background entry point file
            const bgEntryPoint = config.background.entryPoint;
            const bgSrcPath = path.join(pluginDir, pluginId, bgEntryPoint);

            if (fs.existsSync(bgSrcPath)) {
                // Create the output path, preserving the original structure
                const bgDestPath = path.join(publicPluginPath,
                    bgEntryPoint.replace(/\.tsx?$/, '.js'));

                // Create necessary subdirectories
                const bgDestDir = path.dirname(bgDestPath);
                if (!fs.existsSync(bgDestDir)) {
                    fs.mkdirSync(bgDestDir, { recursive: true });
                }

                // Transpile the background file
                transpileTypeScript(bgSrcPath, bgDestPath);
                console.log(`Processed background file: ${bgEntryPoint}`);
            } else {
                console.error(`Could not find background file: ${bgSrcPath}`);
            }

            // Process worker file (assuming it's in the root of the plugin directory)
            const workerPath = path.join(pluginDir, pluginId, 'worker.ts');
            if (fs.existsSync(workerPath)) {
                const workerDestPath = path.join(publicPluginPath, 'worker.js');
                transpileTypeScript(workerPath, workerDestPath);
                console.log(`Processed worker file for ${pluginId}`);
            } else {
                console.error(`Could not find worker file for ${pluginId}`);
            }

            console.log(`Successfully processed plugin: ${pluginId}`);
        } else {
            console.error(`Config file not found for plugin ${pluginId}`);
        }
    }
}

// Ensure necessary directories exist
const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

const publicPluginDir = path.resolve(__dirname, '../public/plugin');
if (!fs.existsSync(publicPluginDir)) {
    fs.mkdirSync(publicPluginDir, { recursive: true });
}

// Copy plugins
console.log('Copying and processing plugins...');
copyPlugins();

// Run the production build
console.log('Running standard build...');
execSync('npm run build', { stdio: 'inherit' });

console.log('Build completed successfully!');