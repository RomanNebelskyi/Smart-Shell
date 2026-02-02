import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('smart-shell')
  .description('A smart shell wrapper')
  .version('0.0.1');

program.action(() => {
  console.log(chalk.green('SmartShell v0.0.1'));
});

program.parse(process.argv);
