#!/usr/bin/env node
import chalk from 'chalk';
import { runWrapper } from './wrapper.js';
import { saveConfig } from './config.js';

const args = process.argv.slice(2);

const command = args[0];
if (!command) {
  console.log(chalk.green('SmartShell - AI-powered CLI Wrapper'));
  console.log('Usage: smart <command> [args...]');
  console.log('       smart config --key <OPENAI_API_KEY>');
  process.exit(0);
}

// Handle config command
if (command === 'config') {
  const keyIndex = args.indexOf('--key');
  const apiKey = keyIndex !== -1 ? args[keyIndex + 1] : undefined;
  if (apiKey) {
    saveConfig('openaiApiKey', apiKey);
    process.exit(0);
  } else {
    console.log(chalk.red('Usage: smart config --key <OPENAI_API_KEY>'));
    process.exit(1);
  }
}

const commandArgs = args.slice(1);
runWrapper(command, commandArgs);
