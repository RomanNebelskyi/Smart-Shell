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

const program = new Command();

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));

program
  .name('smart')
  .description('A local CLI wrapper that intercepts errors and offers AI-generated fixes.')
  .version(packageJson.version);

// Config Command
const configCmd = program
    .command('config')
    .description('Manage configuration')
    .argument('[action]', 'get or set')
    .argument('[key]', 'Config key')
    .argument('[value]', 'Config value')
    .action((action, key, value) => {
        if (action === 'set' && key && value) {
            try {
                configService.set(key as any, value);
                const maskedValue = configService.getForDisplay(key as any);
                console.log(chalk.green(`✅ Configuration updated: ${key} = ${maskedValue}`));
            } catch (error: any) {
                console.error(chalk.red(`❌ Error: ${error.message}`));
                process.exit(1);
            }
        } else if (action === 'get' && key) {
            const maskedValue = configService.getForDisplay(key as any);
            console.log(`${key}: ${maskedValue}`);
        } else {
            console.log(chalk.yellow('Usage:'));
            console.log('  smart config set <key> <value>');
            console.log('  smart config get <key>');
            console.log('\nAvailable keys:');
            console.log('  provider        - LLM provider (openai | anthropic | ollama)');
            console.log('  model           - Model name (e.g., gpt-4o-mini, claude-3-5-sonnet-latest)');
            console.log('  openaiApiKey    - OpenAI API key');
            console.log('  anthropicApiKey - Anthropic API key');
            console.log('  ollamaUrl       - Ollama server URL (default: http://localhost:11434)');
        }
    });

// Explain Command
program
  .command('explain <query...>')
  .description('Explain a command or query using AI')
  .action(async (queryParts) => {
    const query = queryParts.join(' ');
    const spinner = ora('Asking AI for explanation...').start();
    const explanation = await llmService.explain(query);
    spinner.stop();
    
    if (explanation) {
        console.log(chalk.blue('\n📝 Explanation:'));
        console.log(explanation);
    } else {
        console.log(chalk.red('Failed to get explanation. Check your API key and provider settings.'));
    }
  });

// Catch-all for wrapping commands
program
  .arguments('[args...]')
  .passThroughOptions()
  .action(async (args) => {
    if (!args || args.length === 0) {
        program.help();
        return;
    }

    const command = args[0];
    const commandArgs = args.slice(1);

    const apiKey = configService.getApiKey();
    const provider = configService.get('provider') || 'openai';
    
    if (!apiKey && provider !== 'ollama') {
         console.warn(chalk.yellow(`\n⚠️  ${provider.toUpperCase()}_API_KEY not found. Run: smart config set ${provider === 'openai' ? 'openaiApiKey' : 'anthropicApiKey'} <YOUR_KEY>`));
    }

    const result = await executionService.execute(command, commandArgs);

    if (result.exitCode !== 0) {
        console.log();

        let fix: string | null = null;
        
        // Static Handlers
        if (command === 'git') fix = handleGitError(result.stderr);
        else if (['npm', 'pnpm', 'yarn'].includes(command)) fix = handleNodeError(command, result.stderr);
        else if (command === 'docker') fix = handleDockerError(result.stderr);

        if (fix) {
            console.log(chalk.green(`💡 Suggested Fix: ${fix}`));
        }

        // AI Fallback
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
            } catch {
                spinner.stop();
            }
        }
    }

    process.exit(result.exitCode);
  });

program.parse(process.argv);
