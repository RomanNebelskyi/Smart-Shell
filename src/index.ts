#!/usr/bin/env node
import chalk from 'chalk';
import { runWrapper } from './wrapper.js';

const args = process.argv.slice(2);

const command = args[0];
if (!command) {
  console.log(chalk.green('SmartShell - AI-powered CLI Wrapper'));
  console.log('Usage: smart <command> [args...]');
  process.exit(0);
}
const commandArgs = args.slice(1);

runWrapper(command, commandArgs);
