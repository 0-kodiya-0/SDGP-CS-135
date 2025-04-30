#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { copyTemplatePlugin } from './lib/template-handler';

/**
 * User input answers interface
 */
interface PluginAnswers {
    pluginName: string;
    pluginId: string;
    description: string;
    installDeps: boolean;
}

/**
 * Main function to generate the plugin template
 */
async function generateTemplate(): Promise<void> {
    console.log(chalk.blue('🚀 Plugin Template Generator'));
    console.log(chalk.gray('This utility will create a plugin template with the correct structure.\n'));

    // Get plugin information from user
    const answers = await inquirer.prompt<PluginAnswers>([
        {
            type: 'input',
            name: 'pluginName',
            message: 'What is your plugin name?',
            default: path.basename(process.cwd()),
            validate: (input: string) => input.trim() !== '' ? true : 'Plugin name is required'
        },
        {
            type: 'input',
            name: 'pluginId',
            message: 'What is your plugin ID? (lowercase, kebab-case)',
            default: (input: any) => input.pluginName.toLowerCase().replace(/\s+/g, '-'),
            validate: (input: string) => /^[a-z0-9-]+$/.test(input) ? true : 'Plugin ID must be lowercase and kebab-case'
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

    // Create the plugin directory
    const projectDir = path.join(process.cwd(), answers.pluginName);

    // Check if directory already exists
    if (fs.existsSync(projectDir)) {
        const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
            {
                type: 'confirm',
                name: 'overwrite',
                message: `Directory "${answers.pluginName}" already exists. Overwrite?`,
                default: false
            }
        ]);

        if (!overwrite) {
            console.log(chalk.yellow('Operation cancelled. Nothing was modified.'));
            process.exit(0);
        } else {
            // Delete existing directory
            fs.rmSync(projectDir, { recursive: true, force: true });
        }
    }

    const spinner = ora('Creating plugin template...').start();

    try {
        // Copy the template plugin files and update with user data
        await copyTemplatePlugin(projectDir, answers);

        spinner.succeed('Plugin template created successfully!');

        // Install dependencies if requested
        if (answers.installDeps) {
            spinner.text = 'Installing dependencies...';
            spinner.start();

            try {
                // Run npm install in the created directory
                execSync('npm install', { stdio: 'ignore', cwd: projectDir });
                spinner.succeed('Dependencies installed successfully!');
            } catch (error) {
                spinner.fail('Failed to install dependencies.');
                console.error(chalk.red('Error installing dependencies:'), error instanceof Error ? error.message : String(error));
            }
        }

        // Display success message and next steps
        console.log('\n' + chalk.green('🎉 Plugin template created successfully!'));
        console.log('\nNext steps:');
        console.log('  1. ' + chalk.yellow(`cd ${answers.pluginName}`));
        if (!answers.installDeps) {
            console.log('  2. ' + chalk.yellow('npm install') + ' (to install dependencies)');
        }
        console.log('  ' + (answers.installDeps ? '2' : '3') + '. ' + chalk.yellow('npm run dev') + ' (to start development server)');
        console.log('  ' + (answers.installDeps ? '3' : '4') + '. ' + chalk.yellow('npm run build') + ' (to build for production)');
        console.log('\nHappy coding! 🚀\n');

    } catch (error) {
        spinner.fail('Failed to create plugin template.');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

// Main execution
generateTemplate().catch(error => {
    console.error('Failed to create plugin template:', error instanceof Error ? error.message : String(error));
    process.exit(1);
});