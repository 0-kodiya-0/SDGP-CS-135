import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Promisified versions of fs functions
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

/**
 * Plugin data interface
 */
export interface PluginData {
  pluginName: string;
  pluginId: string;
  description: string;
  [key: string]: string | boolean;
}

/**
 * Files and directories to exclude when copying
 */
const EXCLUDED_PATHS = [
  'node_modules',
  'package-lock.json',
  'dist',
  '.git',
  'index.html'
];

/**
 * Copy template plugin and update with user data
 * @param targetDir - The target directory to create the plugin in
 * @param data - User data to replace in configuration files
 */
export async function copyTemplatePlugin(targetDir: string, data: PluginData): Promise<void> {
  // Get the path to the template directory (pre-made plugin example)
  const templateDir = path.join(__dirname, '..', 'template');

  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true });
  }

  // Copy all files from the template directory to the target directory
  await copyDirectory(templateDir, targetDir);

  // Update package.json with user data
  await updatePackageJson(targetDir, data);

  // Update plugin-conf.json with user data
  await updatePluginConf(targetDir, data);

  // Update README.md with user data
  await updateReadme(targetDir, data);
}

/**
 * Copy directory recursively
 * @param sourceDir - Source directory
 * @param targetDir - Target directory
 */
async function copyDirectory(sourceDir: string, targetDir: string): Promise<void> {
  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true });
  }

  // Read all files and directories in the source directory
  const entries = await readdir(sourceDir, { withFileTypes: true });

  // Process each entry
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    // Skip excluded paths
    if (EXCLUDED_PATHS.includes(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      // Recursively copy directory
      await copyDirectory(sourcePath, targetPath);
    } else {
      // Copy file
      await copyFile(sourcePath, targetPath);
    }
  }
}

/**
 * Update package.json with user data
 * @param targetDir - Target directory
 * @param data - User data
 */
async function updatePackageJson(targetDir: string, data: PluginData): Promise<void> {
  const packageJsonPath = path.join(targetDir, 'package.json');

  try {
    // Read the existing package.json
    const packageJsonContent = await readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    // Update with user data
    packageJson.name = data.pluginId;
    packageJson.description = data.description;

    // Write updated package.json
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  } catch (error) {
    console.error('Error updating package.json:', error);
    throw error;
  }
}

/**
 * Update plugin-conf.json with user data
 * @param targetDir - Target directory
 * @param data - User data
 */
async function updatePluginConf(targetDir: string, data: PluginData): Promise<void> {
  const pluginConfPath = path.join(targetDir, 'plugin-conf.json');

  try {
    // Read the existing plugin-conf.json
    const pluginConfContent = await readFile(pluginConfPath, 'utf-8');
    let pluginConf = JSON.parse(pluginConfContent);

    // Update with user data
    pluginConf.id = data.pluginId;
    pluginConf.name = data.pluginName;
    pluginConf.description = data.description;

    // Write updated plugin-conf.json
    await writeFile(pluginConfPath, JSON.stringify(pluginConf, null, 2));
  } catch (error) {
    console.error('Error updating plugin-conf.json:', error);
    throw error;
  }
}

/**
 * Update README.md with user data
 * @param targetDir - Target directory
 * @param data - User data
 */
async function updateReadme(targetDir: string, data: PluginData): Promise<void> {
  const readmePath = path.join(targetDir, 'README.md');

  try {
    // Read the existing README.md
    const readmeContent = await readFile(readmePath, 'utf-8');

    // Replace placeholder variables with user data
    const updatedContent = readmeContent
      .replace(/\${pluginName}/g, data.pluginName)
      .replace(/\${pluginId}/g, data.pluginId)
      .replace(/\${description}/g, data.description);

    // Write updated README.md
    await writeFile(readmePath, updatedContent);
  } catch (error) {
    console.error('Error updating README.md:', error);
    throw error;
  }
}