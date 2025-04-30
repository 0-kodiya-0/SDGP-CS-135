# Create Plugin Template

A CLI tool to generate a plugin template with the correct structure. This tool uses Vite to scaffold a React TypeScript project and then adds plugin-specific structure and files.

## Features

- Creates a new directory for your plugin
- Uses Vite to scaffold a React TypeScript project
- Adds plugin-specific structure for views, background scripts, and services
- Configures the project with necessary files for plugin development
- Template-based approach for easy maintenance and customization

## Installation

You can install and use this tool in two ways:

### Global Installation

```bash
npm install -g create-plugin-template
```

Then run it anywhere:

```bash
create-plugin-template
```

### Using npx

```bash
npx create-plugin-template
```

## Usage

The tool will prompt you for the following information:

1. Plugin name - The name of your plugin
2. Plugin ID - A lowercase, kebab-case identifier for your plugin
3. Description - A short description of your plugin
4. Whether to install dependencies after setup

## Structure

The generated plugin will have the following structure:

```
your-plugin-name/
├── package.json              # NPM package configuration
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build configuration
├── plugin-conf.json          # Plugin configuration
├── .gitignore                # Git ignore rules
├── README.md                 # README file
├── public/                   # Public assets
│   └── icon.png              # Plugin icon
└── src/                      # Source code
    ├── views/                # UI views
    │   ├── summary/          # Summary view
    │   │   ├── App.tsx       
    │   │   └── index.ts      
    │   └── expand/           # Expanded view
    │       ├── App.tsx       
    │       └── index.ts      
    ├── scripts/              # Scripts
    │   └── background/       # Background script
    │       └── index.ts      
    └── common/               # Shared code
        ├── utils/            # Utilities
        │   └── index.ts      
        └── services/         # Services
            └── api.ts        # API service
```

## Customizing Templates

To customize the templates, modify the files in the `templates/` directory. You can use the following variables in your templates:

- `${pluginName}` - The name of the plugin
- `${pluginId}` - The plugin ID
- `${description}` - The plugin description

## Development

### Project Structure

```
create-plugin-template/
├── index.js                  # Main CLI entry point
├── package.json              # Package configuration
├── lib/
│   └── template-generator.js # Code to process and copy templates
└── templates/                # Template files with variables
    ├── src/                  # Template source files
    ├── public/               # Template public files
    ├── plugin-conf.json      # Template plugin configuration
    └── README.md             # Template README
```

### Adding or Modifying Templates

1. Edit or add files in the `templates/` directory
2. Use template variables where needed (`${pluginName}`, `${pluginId}`, `${description}`)
3. The template generator will automatically process these variables

## License

MIT