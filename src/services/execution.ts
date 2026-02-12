import { execa } from "execa";
import type { ExecutionResult } from "../interfaces.js";

export class ExecutionService {
  async execute(command: string, args: string[]): Promise<ExecutionResult> {
    try {
      const subprocess = execa(command, args, {
        reject: false,
        stdio: "pipe",
      });

      if (subprocess.stdout) {
        subprocess.stdout.pipe(process.stdout);
      }
      if (subprocess.stderr) {
        subprocess.stderr.pipe(process.stderr);
      }

      const result = await subprocess;

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode ?? 1,
      };
    } catch (error: any) {
      return {
        stdout: "",
        stderr: error.message,
        exitCode: 1,
      };
    }
  }
}

export const executionService = new ExecutionService();
