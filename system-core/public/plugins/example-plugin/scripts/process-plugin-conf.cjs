const fs = require('fs');
const path = require('path');

// Read the plugin configuration
const configPath = path.join(__dirname, '..', 'plugin.conf.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Update with the actual build file paths
config.background.entryPoint = 'background/index.js';
config.view.summary.entryPoint = 'summary/index.js';
config.view.expand.entryPoint = 'expand/index.js';

// Get the list of built files for bundles
const distPath = path.join(__dirname, '..', 'dist');
const bundleFiles = [];

// Function to find all files in a directory recursively
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else {
      // Convert to relative path from dist directory
      const relativePath = path.relative(distPath, filePath).replace(/\\/g, '/');
      fileList.push(relativePath);
    }
  }
  
  return fileList;
}

// Get all files in the dist directory
const allFiles = findFiles(distPath);

// Update the bundles array with the actual files
config.assets.bundles = allFiles.filter(file => file.endsWith('.js') || file.endsWith('.css'));
config.assets.images = allFiles.filter(file => /\.(png|jpg|jpeg|gif|svg)$/i.test(file));
config.assets.other = allFiles.filter(file => 
  !file.endsWith('.js') && 
  !file.endsWith('.css') && 
  !/\.(png|jpg|jpeg|gif|svg)$/i.test(file)
);

// Write the updated configuration back to the file
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log('Plugin configuration updated successfully!');