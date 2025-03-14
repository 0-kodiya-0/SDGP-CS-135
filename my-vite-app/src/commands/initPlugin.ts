import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

const initplugin = async (PluginName: string) => {
    const pluginDir = path.resolve(process.cwd(), PluginName);

    if (fs.existsSync(pluginDir)) {
        console.log('Plugin already exists');
    }

    fs.mkdirSync(pluginDir, { recursive: true });
    fs.mkdirSync(path.resolve(pluginDir, 'src'), { recursive: true });
    fs.mkdirSync(path.resolve(pluginDir, 'assets'), { recursive: true });

    const templateDir = path.join(__dirname, '../templates/plugin-template');
    fs.cpSync(templateDir, pluginDir, { recursive: true });

    console.log('Plugin ${pulginName}')
};

inquirer.prompt([
    {
        type: 'input',
        name: 'pluginName',
        message: 'Enter the plugin name'
    }
]).then((answers) => {
    initplugin(answers.pluginName);
});




