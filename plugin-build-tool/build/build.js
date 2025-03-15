
import path, { dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATE_DIR = path.resolve(__dirname, '../templates/plugin-template');
const DIST_DIR = path.resolve(__dirname, '../dist');

export const buildPlugin = async () => {
  console.log('Building plugin...');
  try {
    // Run TypeScript compilation
    execSync('tsc -b', { stdio: 'inherit' });

    // Use Vite to bundle the plugin (replace with actual build logic)
    execSync('vite build', { stdio: 'inherit' });

    console.log('Plugin built successfully!');
  } catch (error) {
    console.error('Error building plugin:', error);
  }
};

export const packagePlugin = async () => {
  console.log('Packaging plugin...');
  try {
    // Create a zip or tarball from the build output
    const pluginName = 'example-plugin.zip'; // Use the actual plugin name
    const outputPath = path.resolve(DIST_DIR, pluginName);

    execSync(`zip -r ${outputPath} ${TEMPLATE_DIR}/src`, { stdio: 'inherit' });

    console.log(`Plugin packaged: ${pluginName}`);
  } catch (error) {
    console.error('Error packaging plugin:', error);
  }
};


