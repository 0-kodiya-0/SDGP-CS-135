#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { execSync } = require('child_process');
const inquirer = require('inquirer');
const chalk = require('chalk');
const ora = require('ora');

// Promisified versions of fs functions
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

// Define the template files and directories
const TEMPLATE_STRUCTURE = {
    src: {
        views: {
            summary: {
                'App.tsx': createSummaryAppComponent,
                'index.ts': createSummaryIndex
            },
            expand: {
                'App.tsx': createExpandAppComponent,
                'index.ts': createExpandIndex
            }
        },
        scripts: {
            background: {
                'index.ts': createBackgroundIndex
            }
        },
        common: {
            utils: {
                'index.ts': createUtilsIndex
            },
            services: {
                'api.ts': createApiService
            }
        }
    },
    public: {
        'icon.png': null // Will be created as an empty placeholder
    },
    'package.json': createPackageJson,
    'tsconfig.json': createTsConfig,
    'vite.config.ts': createViteConfig,
    'plugin-conf.json': createPluginConf,
    '.gitignore': createGitignore,
    'README.md': createReadme
};

async function generateTemplate() {
    console.log(chalk.blue('🚀 Plugin Template Generator'));
    console.log(chalk.gray('This utility will create a plugin template with the correct structure.\n'));

    // Get plugin information from user
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'pluginName',
            message: 'What is your plugin name?',
            default: path.basename(process.cwd()),
            validate: input => input.trim() !== '' ? true : 'Plugin name is required'
        },
        {
            type: 'input',
            name: 'pluginId',
            message: 'What is your plugin ID? (lowercase, kebab-case)',
            default: input => path.basename(process.cwd()).toLowerCase().replace(/\s+/g, '-'),
            validate: input => /^[a-z0-9-]+$/.test(input) ? true : 'Plugin ID must be lowercase and kebab-case'
        },
        {
            type: 'input',
            name: 'description',
            message: 'Provide a short description for your plugin:',
            default: 'A plugin for extending application functionality'
        },
        {
            type: 'confirm',
            name: 'installDeps',
            message: 'Install dependencies after setup?',
            default: true
        }
    ]);

    const spinner = ora('Creating plugin template...').start();

    try {
        // Create directories and files based on template structure
        await createDirectoryStructure(TEMPLATE_STRUCTURE, process.cwd(), answers);

        spinner.succeed('Plugin template created successfully!');

        // Install dependencies if requested
        if (answers.installDeps) {
            spinner.text = 'Installing dependencies...';
            spinner.start();

            try {
                execSync('npm install', { stdio: 'ignore' });
                spinner.succeed('Dependencies installed successfully!');
            } catch (error) {
                spinner.fail('Failed to install dependencies.');
                console.error(chalk.red('Error installing dependencies:'), error.message);
            }
        }

        // Display success message and next steps
        console.log('\n' + chalk.green('🎉 Plugin template created successfully!'));
        console.log('\nNext steps:');
        console.log('  1. ' + chalk.yellow(`cd ${answers.pluginName}`) + ' (if not already in the directory)');
        if (!answers.installDeps) {
            console.log('  2. ' + chalk.yellow('npm install') + ' (to install dependencies)');
        }
        console.log('  ' + (answers.installDeps ? '2' : '3') + '. ' + chalk.yellow('npm run dev') + ' (to start development server)');
        console.log('  ' + (answers.installDeps ? '3' : '4') + '. ' + chalk.yellow('npm run build') + ' (to build for production)');
        console.log('\nHappy coding! 🚀\n');

    } catch (error) {
        spinner.fail('Failed to create plugin template.');
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
    }
}

// Create directory structure recursively
async function createDirectoryStructure(structure, basePath, data) {
    for (const [name, content] of Object.entries(structure)) {
        const fullPath = path.join(basePath, name);

        if (typeof content === 'object' && content !== null) {
            // Create directory
            await mkdir(fullPath, { recursive: true });
            // Recursively create nested structure
            await createDirectoryStructure(content, fullPath, data);
        } else if (typeof content === 'function') {
            // Create file with content from generator function
            const fileContent = content(data);
            await writeFile(fullPath, fileContent);
        } else if (name === 'icon.png') {
            // Create placeholder icon file
            const iconPlaceholder = Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAA' +
                'CXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJLSURBVHgB7d0' +
                'xbxNBEIbh2T0SASmKIhACCUGDkCigoYIWQc0P4jfkJ9BSpiWCJgVC0EEBBRJSuJPvLnO7CxvlPE/p2Y' +
                '1Hnz5pL7q72dna2lqh1mg0SvP5vGE7xuNxyvP8lJ89Pj7eBQAAAAAAAAAe09zcXEwppcWFhbC6upouV' +
                'ldTM5vFtNudzzvCKzCbzaq9Xs++9tPDw8MuD+vt7e0gtvbLLfpHGn/IU7S+sR7X1tfD/Xv3QyoUMh6O' +
                'w3A4DMPhKBwcfAlvbtyIJycnqT8ej/b29vay/f39T97e3j7LtWc+e0Uul8nJLKWnQ7sXvw+KqpVKnYo' +
                'i1nWdi6LodLrdbrPZbF738eb29nafAgAAAAAAAPjfZCN77HEz+zLNNNgLSzSvx1QqYTAo4o3GK1tM1p' +
                'k8+cP67/iP4k/xffyZv5Nz2t6znyebJ98mfmfib7HLQbm2toJXIMuyYllZ8b9SSrmuF3kmUyiXnbzPt' +
                '8vIH/lJ+hn/iUe2/Jk8jkKQb+XCsp/xRpbLg9gmRWYntyP+nnwv3wchjUYj390AgAAAAAAA+FfTZFAs' +
                'nliKedw5O2uzXnfOOG/vZnZynmV2TmYnnk6nk0mleHRaKV7Pk+N3crvj3J75zMrZc7VarayUKfliUmd' +
                'y52RWJs/KN+VpHbtz6JxDBgAAAAAAAPBKCUD+5NLG9fDn3HnpLN3T8+dxJX5Wns62a/oUmm8XAAAAAAAAAAAAAAAAAODtf/X09PT64uLimt2wt9W4ZfOXZb1eb6e8vLx8XFVVAQAAAAC8Hb8A/AdN3UNuv3IAAAAASUVORK5CYII=',
                'base64'
            );
            await writeFile(fullPath, iconPlaceholder);
        }
    }
}

// Template generators for each file type
function createPackageJson(data) {
    return `{
  "name": "${data.pluginId}",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.2.5",
    "@types/react": "^18.2.9",
    "@types/react-dom": "^18.2.4",
    "@vitejs/plugin-react": "^4.0.0",
    "enhanced-resolve": "^5.15.0", 
    "es-module-lexer": "^1.3.0",
    "glob": "^10.3.0",
    "typescript": "^5.1.3",
    "vite": "^4.3.9"
  }
}`;
}

function createTsConfig(data) {
    return `{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`;
}

function createViteConfig(data) {
    return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import processPluginConf from './vite-plugin-process-plugin-conf';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    processPluginConf({
      configPath: './plugin-conf.json',
      publicDir: 'public',
      watchMode: true
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      input: {
        // Define separate entry points
        'summary': resolve(__dirname, 'src/views/summary/index.ts'),
        'expand': resolve(__dirname, 'src/views/expand/index.ts'),
        'background': resolve(__dirname, 'src/scripts/background/index.ts'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/shared-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    }
  },
});`;
}

function createPluginConf(data) {
    return `{
  "id": "${data.pluginId}",
  "name": "${data.pluginName}",
  "version": "1.0.0",
  "description": "${data.description}",
  "icon": "public/icon.png",
  "internalPlugin": false,
  
  "view": {
    "summary": {
      "entryPoint": "src/views/summary/index.ts"
    },
    "expand": {
      "entryPoint": "src/views/expand/index.ts"
    }
  },
  
  "background": {
    "entryPoint": "src/scripts/background/index.ts"
  },
  
  "permissions": {
    "storage": true
  },
  
  "settings": {
    "defaultEnabled": true
  },
  
  "assets": {
    "bundles": [],
    "images": [],
    "other": []
  }
}`;
}

function createGitignore(data) {
    return `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?`;
}

function createReadme(data) {
    return `# ${data.pluginName}

${data.description}

## Development

This plugin uses Vite for development and building.

### Installation

\`\`\`bash
npm install
\`\`\`

### Development Server

\`\`\`bash
npm run dev
\`\`\`

### Build for Production

\`\`\`bash
npm run build
\`\`\`

## Structure

- \`src/views/summary\`: Summary view components
- \`src/views/expand\`: Expand view components
- \`src/scripts/background\`: Background script
- \`src/common\`: Shared utilities and services
- \`plugin-conf.json\`: Plugin configuration

## Configuration

Plugin configuration is managed in \`plugin-conf.json\`. This file is automatically updated during the build process to include all necessary dependencies and assets.
`;
}

function createSummaryAppComponent(data) {
    return `import React from 'react';
import { apiService } from '@/common/services/api';

const App: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await apiService.getData();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="summary-view">
      <h1>${data.pluginName} - Summary View</h1>
      
      {loading ? (
        <p>Loading data...</p>
      ) : data ? (
        <div className="data-container">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default App;`;
}

function createSummaryIndex(data) {
    return `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Function to initialize the summary view
export function initialize(container: HTMLElement) {
  const root = createRoot(container);
  root.render(<App />);
  
  return {
    // Cleanup function called when view is unmounted
    destroy: () => {
      root.unmount();
    }
  };
}`;
}

function createExpandAppComponent(data) {
    return `import React from 'react';
import { apiService } from '@/common/services/api';

const App: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [detailedData, setDetailedData] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchDetailedData = async () => {
      setLoading(true);
      try {
        const result = await apiService.getDetailedData();
        setDetailedData(result);
      } catch (error) {
        console.error('Error fetching detailed data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedData();
  }, []);

  return (
    <div className="expand-view">
      <h1>${data.pluginName} - Expanded View</h1>
      
      {loading ? (
        <p>Loading detailed data...</p>
      ) : detailedData ? (
        <div className="detailed-data-container">
          <h2>Detailed Information</h2>
          <pre>{JSON.stringify(detailedData, null, 2)}</pre>
        </div>
      ) : (
        <p>No detailed data available</p>
      )}
    </div>
  );
};

export default App;`;
}

function createExpandIndex(data) {
    return `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Function to initialize the expand view
export function initialize(container: HTMLElement) {
  const root = createRoot(container);
  root.render(<App />);
  
  return {
    // Cleanup function called when view is unmounted
    destroy: () => {
      root.unmount();
    }
  };
}`;
}

function createBackgroundIndex(data) {
    return `import { apiService } from '@/common/services/api';

// Background script that runs in the background when the plugin is active
// This can handle tasks like data syncing, notifications, etc.

// Initialize the background service
export function initialize() {
  console.log('Background script initialized for ${data.pluginName}');
  
  // Set up any listeners or background tasks
  const intervalId = setInterval(async () => {
    try {
      // Example: Periodically fetch and process data
      const data = await apiService.getData();
      console.log('Background data update:', data);
      
      // Could trigger notifications or other actions based on data
    } catch (error) {
      console.error('Background task error:', error);
    }
  }, 300000); // Every 5 minutes
  
  // Return cleanup function
  return {
    destroy: () => {
      console.log('Background script cleanup');
      clearInterval(intervalId);
    }
  };
}`;
}

function createUtilsIndex(data) {
    return `// Collection of utility functions for use across the plugin

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}`;
}

function createApiService(data) {
    return `// API service for interacting with external data sources

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Mock data for development purposes
const MOCK_DATA = {
  summary: {
    lastUpdated: new Date().toISOString(),
    count: 42,
    status: 'active'
  },
  detailed: {
    items: [
      { id: 1, name: 'Item 1', value: 100 },
      { id: 2, name: 'Item 2', value: 200 },
      { id: 3, name: 'Item 3', value: 300 }
    ],
    metadata: {
      totalItems: 3,
      category: 'test'
    }
  }
};

/**
 * Service for handling API requests
 */
class ApiService {
  private baseUrl: string = '';
  private mockMode: boolean = true; // Set to false in production
  
  constructor() {
    // Initialize with configuration
    // In a real implementation, you might load the baseUrl from plugin settings
  }
  
  /**
   * Fetch basic data for the summary view
   */
  async getData(): Promise<any> {
    if (this.mockMode) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return MOCK_DATA.summary;
    }
    
    try {
      const response = await fetch(\`\${this.baseUrl}/data\`);
      const json = await response.json() as ApiResponse<any>;
      
      if (!json.success) {
        throw new Error(json.error || 'Unknown error');
      }
      
      return json.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  /**
   * Fetch detailed data for the expanded view
   */
  async getDetailedData(): Promise<any> {
    if (this.mockMode) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return MOCK_DATA.detailed;
    }
    
    try {
      const response = await fetch(\`\${this.baseUrl}/detailed\`);
      const json = await response.json() as ApiResponse<any>;
      
      if (!json.success) {
        throw new Error(json.error || 'Unknown error');
      }
      
      return json.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  /**
   * Send updated data to the API
   */
  async updateData(data: any): Promise<boolean> {
    if (this.mockMode) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600));
      console.log('Mock update data:', data);
      return true;
    }
    
    try {
      const response = await fetch(\`\${this.baseUrl}/update\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const json = await response.json() as ApiResponse<any>;
      
      if (!json.success) {
        throw new Error(json.error || 'Update failed');
      }
      
      return true;
    } catch (error) {
      console.error('API Update Error:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const apiService = new ApiService();
`;
}

// Main execution
generateTemplate().catch(error => {
    console.error('Failed to create plugin template:', error);
    process.exit(1);
});