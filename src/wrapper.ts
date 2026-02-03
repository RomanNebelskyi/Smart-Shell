import { execa } from 'execa';
import chalk from 'chalk';

export async function runWrapper(command: string, args: string[]) {
  // Optional: Print what we are running
  // console.log(chalk.gray(`> Running: ${command} ${args.join(' ')}`));

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
      console.log(chalk.red(`⚠️ Error detected:`));
      console.log(chalk.red(result.stderr.trim()));
      
      // TODO: Send error to AI for analysis
    }

    process.exit(result.exitCode);

  } catch (error: any) {
    // This catches synchronous errors like command not found (ENOENT)
    console.error(chalk.red(`⚠️ Execution failed: ${error.message}`));
    process.exit(1);
  }
}
