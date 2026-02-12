#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { configService } from './services/config.js';
import { llmService } from './services/llm.js';
import { executionService } from './services/execution.js';
import { handleGitError } from './handlers/git.js';
import { handleNodeError } from './handlers/node.js';
import { handleDockerError } from './handlers/docker.js';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));

program
  .name('smart')
  .description('A local CLI wrapper that intercepts errors and offers AI-generated fixes.')
  .version(packageJson.version);

// Config Command
const configCommand = program.command('config')
  .description('Manage configuration')
  .option('--set <key> <value>', 'Set a config value (e.g., --set openaiApiKey sk-...)')
  .option('--get <key>', 'Get a config value')
  .action((options) => {
    if (options.set) {
      // Handle the case where key might be passed as "set" if spacing is weird, but commander handles --set key value?
      // Wait, .option('--set <key> <value>') implies --set takes 2 args? No, commander option takes at most 1 arg usually unless custom processing.
      // Better: smart config set <key> <value>
    }
  });

program
    .command('config')
    .description('Manage configuration')
    .argument('[action]', 'get or set') // optional argument
    .argument('[key]', 'Config key')
    .argument('[value]', 'Config value')
    .action((action, key, value) => {
        if (action === 'set' && key && value) {
            configService.set(key as any, value);
            console.log(chalk.green(`Configuration updated: ${key} = ${value}`));
        } else if (action === 'get' && key) {
            const val = configService.get(key as any);
            console.log(`${key}: ${val}`);
        } else {
            console.log(chalk.yellow('Usage:'));
            console.log('  smart config set <key> <value>');
            console.log('  smart config get <key>');
            console.log('\nKeys: openaiApiKey, anthropicApiKey, ollamaUrl, provider, model');
        }
    });


// Explain Command
program
  .command('explain <query...>')
  .description('Explain a command or query')
  .action(async (queryParts) => {
    const query = queryParts.join(' ');
    const spinner = ora('Asking AI for explanation...').start();
    const explanation = await llmService.explain(query);
    spinner.stop();
    
    if (explanation) {
        console.log(chalk.blue('\n📝 Explanation:'));
        console.log(explanation);
    } else {
        console.log(chalk.red('Failed to get explanation. Check your API key.'));
    }
  });

// Catch-all for wrapping
program
  .arguments('[args...]')
  .passThroughOptions()
  .action(async (args, commandObj) => {
    // If no args, show help
    if (!args || args.length === 0) {
        program.help();
        return;
    }

    const command = args[0];
    const commandArgs = args.slice(1);

    // Filter out internal commands if they somehow leak, but commander handles specific commands first.
    // However, if I run "smart git status", "git" is args[0].
    
    // Check Config
    const apiKey = configService.getApiKey();
    const provider = configService.get('provider') || 'openai';
    
    if (!apiKey && provider !== 'ollama') {
         console.warn(chalk.yellow(`\n⚠️  ${provider.toUpperCase()}_API_KEY not found. Run: smart config set ${provider}ApiKey <YOUR_KEY>`));
         // We continue anyway, but AI won't work
    }

    const result = await executionService.execute(command, commandArgs);

    if (result.exitCode !== 0) {
        console.log(); // Newline

        let fix: string | null = null;
        
        // Static Handlers
        if (command === 'git') fix = handleGitError(result.stderr);
        else if (['npm', 'pnpm', 'yarn'].includes(command)) fix = handleNodeError(command, result.stderr);
        else if (command === 'docker') fix = handleDockerError(result.stderr);

        if (fix) {
            console.log(chalk.green(`💡 Suggested Fix: ${fix}`));
            // We could offer to run it, but for MVP just showing is fine.
        }

        // AI Handler
        if (!fix) {
            const spinner = ora('Asking AI for help...').start();
            try {
                const aiFix = await llmService.getFix(`${command} ${commandArgs.join(' ')}`, result.stderr);
                spinner.stop();
                if (aiFix) {
                    console.log(chalk.green(`🤖 AI Suggestion: ${aiFix}`));
                } else {
                    console.log(chalk.grey('No AI suggestion available.'));
                }
            } catch (e) {
                spinner.stop();
                // fail silently
            }
        }
    }

    process.exit(result.exitCode);
  });

program.parse(process.argv);
