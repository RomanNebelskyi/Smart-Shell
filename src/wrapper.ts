import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import { handleGitError } from './handlers/git.js';
import { handleNpmError } from './handlers/npm.js';
import { handleDockerError } from './handlers/docker.js';
import { getFixFromLLM } from './llm.js';

export async function runWrapper(command: string, args: string[]) {
  try {
    const subprocess = execa(command, args, {
      reject: false, // Do not throw on non-zero exit code
    });

    // Pipe output to parent process for real-time feedback
    if (subprocess.stdout) {
      subprocess.stdout.pipe(process.stdout);
    }
    if (subprocess.stderr) {
      subprocess.stderr.pipe(process.stderr);
    }

    const result = await subprocess;

    if (result.failed) {
      console.log(); // Add a newline for separation
      
      let fix: string | null = null;

      if (command === 'git') {
        fix = handleGitError(result.stderr);
        if (fix) {
          console.log(chalk.green(`💡 Suggested Fix: ${fix}`));
        }
      } else if (['npm', 'pnpm', 'yarn'].includes(command)) {
        fix = handleNpmError(result.stderr);
        if (fix) {
          console.log(chalk.green(`💡 Suggested Fix: ${fix}`));
        }
      } else if (command === 'docker') {
        fix = handleDockerError(result.stderr);
        if (fix) {
          console.log(chalk.green(`💡 Suggested Fix: ${fix}`));
        }
      }

      if (!fix) {
        const spinner = ora('Asking AI for help...').start();
        const aiFix = await getFixFromLLM(`${command} ${args.join(' ')}`, result.stderr);
        spinner.stop();

        if (aiFix) {
          console.log(chalk.green(`🤖 AI Suggestion: ${aiFix}`));
        }
      }
    }

    process.exit(result.exitCode);

  } catch (error: any) {
    // This catches synchronous errors like command not found (ENOENT)
    console.error(chalk.red(`⚠️ Execution failed: ${error.message}`));
    process.exit(1);
  }
}
