#!/usr/bin/env node

import inquirer from 'inquirer';
import { buildPlugin, packagePlugin } from '../build/build.js';


const main = async () => {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What do you want to do?',
      choices: ['Build Plugin', 'Package Plugin', 'Exit'],
    },
  ]);

  switch (action) {
    case 'Build Plugin':
      await buildPlugin();
      break;
    case 'Package Plugin':
      await packagePlugin();
      break;
    default:
      console.log('Exiting...');
      break;
  }
};

main();
