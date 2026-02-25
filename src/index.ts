#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { configService } from "./services/config.js";
import { llmService } from "./services/llm.js";
import { executionService } from "./services/execution.js";
import { historyService } from "./services/history.js";
import { handleGitError } from "./handlers/git.js";
import { handleNodeError } from "./handlers/node.js";
import { handleDockerError } from "./handlers/docker.js";
import { handleKubectlError } from "./handlers/kubectl.js";
import { handleTerraformError } from "./handlers/terraform.js";
import * as fs from "fs";
import * as readline from "readline";

const program = new Command();

const packageJson = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf-8"),
);

program
  .name("smart")
  .description(
    "A local CLI wrapper that intercepts errors and offers AI-generated fixes.",
  )
  .version(packageJson.version);

// Helper function to prompt user
function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// Config Command
program
  .command("config")
  .description("Manage configuration")
  .argument("[action]", "get or set")
  .argument("[key]", "Config key")
  .argument("[value]", "Config value")
  .action((action, key, value) => {
    if (action === "set" && key && value) {
      try {
        configService.set(key as any, value);
        const maskedValue = configService.getForDisplay(key as any);
        console.log(
          chalk.green(`✅ Configuration updated: ${key} = ${maskedValue}`),
        );
      } catch (error: any) {
        console.error(chalk.red(`❌ Error: ${error.message}`));
        process.exit(1);
      }
    } else if (action === "get" && key) {
      const maskedValue = configService.getForDisplay(key as any);
      console.log(`${key}: ${maskedValue}`);
    } else {
      console.log(chalk.yellow("Usage:"));
      console.log("  smart config set <key> <value>");
      console.log("  smart config get <key>");
      console.log("\nAvailable keys:");
      console.log(
        "  provider        - LLM provider (openai | anthropic | gemini | ollama)",
      );
      console.log(
        "  model           - Model name (e.g., gpt-4o-mini, claude-3-5-sonnet-latest, gemini-2.0-flash-exp)",
      );
      console.log("  openaiApiKey    - OpenAI API key");
      console.log("  anthropicApiKey - Anthropic API key");
      console.log("  geminiApiKey    - Google Gemini API key");
      console.log(
        "  ollamaUrl       - Ollama server URL (default: http://localhost:11434)",
      );
      console.log(
        "  timeout         - AI request timeout in seconds (default: 10)",
      );
      console.log(
        "  autoRun         - Auto-run suggested fixes without confirmation (default: false)",
      );
    }
  });

// Init Command
program
  .command("init")
  .description("Interactive setup wizard")
  .action(async () => {
    console.log(chalk.blue("🚀 SmartShell Setup Wizard\n"));

    // Choose provider
    console.log("Available providers:");
    console.log("  1. OpenAI (gpt-4o-mini)");
    console.log("  2. Anthropic (claude-3-5-sonnet)");
    console.log("  3. Google Gemini (gemini-2.0-flash-exp)");
    console.log("  4. Ollama (local, no API key needed)\n");

    const providerChoice = await promptUser("Choose provider [1-4]: ");
    const providerMap: Record<string, string> = {
      "1": "openai",
      "2": "anthropic",
      "3": "gemini",
      "4": "ollama",
    };

    const provider = providerMap[providerChoice] || "openai";
    configService.set("provider", provider as any);
    console.log(chalk.green(`✅ Provider set to: ${provider}\n`));

    // Set API key if needed
    if (provider !== "ollama") {
      const keyName =
        provider === "openai"
          ? "openaiApiKey"
          : provider === "anthropic"
            ? "anthropicApiKey"
            : "geminiApiKey";
      const apiKey = await promptUser(
        `Enter your ${provider.toUpperCase()} API key: `,
      );
      if (apiKey) {
        configService.set(keyName as any, apiKey);
        console.log(chalk.green(`✅ API key saved\n`));
      }
    }

    // Test connection
    console.log(chalk.blue("Testing connection..."));
    const spinner = ora("Sending test request...").start();
    try {
      const testResponse = await llmService.explain("echo hello");
      spinner.stop();
      if (testResponse) {
        console.log(chalk.green("✅ Connection successful!\n"));
        console.log(chalk.blue("SmartShell is ready to use. Try:"));
        console.log("  smart git status");
        console.log('  smart explain "git rebase"');
      } else {
        spinner.stop();
        console.log(
          chalk.yellow("⚠️  Connection test failed. Check your API key."),
        );
      }
    } catch {
      spinner.stop();
      console.log(chalk.red("❌ Connection test failed."));
    }
  });

// History Command
program
  .command("history")
  .description("View recent errors and fixes")
  .option("-n, --number <count>", "Number of entries to show", "10")
  .option("--clear", "Clear history")
  .action((options) => {
    if (options.clear) {
      historyService.clear();
      console.log(chalk.green("✅ History cleared"));
      return;
    }

    const entries = historyService.getRecent(parseInt(options.number));
    if (entries.length === 0) {
      console.log(chalk.yellow("No history entries found."));
      return;
    }

    console.log(chalk.blue(`\n📜 Recent Errors (${entries.length}):\n`));
    entries.forEach((entry, i) => {
      const date = new Date(entry.timestamp).toLocaleString();
      const icon = entry.applied ? "✅" : entry.source === "ai" ? "🤖" : "💡";
      console.log(`${i + 1}. ${icon} ${chalk.dim(date)}`);
      console.log(`   Command: ${chalk.cyan(entry.command)}`);
      console.log(`   Fix: ${chalk.green(entry.fix)}`);
      console.log();
    });
  });

// Explain Command
program
  .command("explain <query...>")
  .description("Explain a command or query using AI")
  .action(async (queryParts) => {
    const query = queryParts.join(" ");
    const timeout = (configService.get("timeout") || 10) * 1000;
    const spinner = ora("Asking AI for explanation...").start();

    try {
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), timeout),
      );
      const explanation = await Promise.race([
        llmService.explain(query),
        timeoutPromise,
      ]);
      spinner.stop();

      if (explanation) {
        console.log(chalk.blue("\n📝 Explanation:"));
        console.log(explanation);
      } else {
        console.log(
          chalk.red(
            "Failed to get explanation. Check your API key and provider settings.",
          ),
        );
      }
    } catch (error: any) {
      spinner.stop();
      if (error.message === "Request timed out") {
        console.log(
          chalk.red(
            "⏱️  Request timed out. Try increasing timeout: smart config set timeout 20",
          ),
        );
      } else {
        console.log(chalk.red("Failed to get explanation."));
      }
    }
  });

// Catch-all for wrapping commands
program
  .arguments("[args...]")
  .passThroughOptions()
  .action(async (args) => {
    if (!args || args.length === 0) {
      program.help();
      return;
    }

    const command = args[0];
    const commandArgs = args.slice(1);

    const apiKey = configService.getApiKey();
    const provider = configService.get("provider") || "openai";
    const timeout = (configService.get("timeout") || 10) * 1000;
    const autoRun = configService.get("autoRun") || false;

    if (!apiKey && provider !== "ollama") {
      const keyName =
        provider === "openai"
          ? "openaiApiKey"
          : provider === "anthropic"
            ? "anthropicApiKey"
            : "geminiApiKey";
      console.warn(
        chalk.yellow(
          `\n⚠️  ${provider.toUpperCase()}_API_KEY not found. Run: smart config set ${keyName} <YOUR_KEY>`,
        ),
      );
    }

    const result = await executionService.execute(command, commandArgs);

    if (result.exitCode !== 0) {
      console.log();

      let fix: string | null = null;
      let source: "handler" | "ai" = "handler";

      // Static Handlers
      if (command === "git") fix = handleGitError(result.stderr);
      else if (["npm", "pnpm", "yarn"].includes(command))
        fix = handleNodeError(command, result.stderr);
      else if (command === "docker") fix = handleDockerError(result.stderr);
      else if (command === "kubectl" || command === "k")
        fix = handleKubectlError(result.stderr);
      else if (command === "terraform" || command === "tf")
        fix = handleTerraformError(result.stderr);

      if (fix) {
        console.log(chalk.green(`💡 Suggested Fix: ${fix}`));
      }

      // AI Fallback
      if (!fix) {
        const spinner = ora("Asking AI for help...").start();
        try {
          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), timeout),
          );
          const aiFix = await Promise.race([
            llmService.getFix(
              `${command} ${commandArgs.join(" ")}`,
              result.stderr,
            ),
            timeoutPromise,
          ]);
          spinner.stop();
          if (aiFix) {
            fix = aiFix;
            source = "ai";
            console.log(chalk.green(`🤖 AI Suggestion: ${aiFix}`));
          } else {
            console.log(chalk.grey("No AI suggestion available."));
          }
        } catch (error: any) {
          spinner.stop();
          if (error.message === "Request timed out") {
            console.log(chalk.red("⏱️  AI request timed out."));
          }
        }
      }

      // Interactive fix confirmation
      if (fix) {
        let shouldRun = autoRun;

        if (!autoRun) {
          const answer = await promptUser(
            chalk.yellow("\n   Run this fix? [Y/n]: "),
          );
          shouldRun = answer === "" || answer === "y" || answer === "yes";
        }

        if (shouldRun) {
          console.log(chalk.blue("\n🔧 Applying fix..."));
          try {
            // Parse the fix command
            const fixParts = fix.split(" ").filter((p) => p.trim());
            const fixCommand = fixParts[0];
            const fixArgs = fixParts.slice(1);

            if (!fixCommand) {
              console.log(chalk.red("❌ Invalid fix command."));
              return;
            }

            const fixResult = await executionService.execute(
              fixCommand,
              fixArgs,
            );

            if (fixResult.exitCode === 0) {
              console.log(chalk.green("✅ Fix applied successfully!"));
              historyService.addEntry({
                command: `${command} ${commandArgs.join(" ")}`,
                error: result.stderr,
                fix,
                source,
                applied: true,
              });
            } else {
              console.log(chalk.red("❌ Fix failed."));
              historyService.addEntry({
                command: `${command} ${commandArgs.join(" ")}`,
                error: result.stderr,
                fix,
                source,
                applied: false,
              });
            }
          } catch (error) {
            console.log(chalk.red("❌ Failed to apply fix."));
            historyService.addEntry({
              command: `${command} ${commandArgs.join(" ")}`,
              error: result.stderr,
              fix,
              source,
              applied: false,
            });
          }
        } else {
          console.log(chalk.dim("Fix not applied."));
          historyService.addEntry({
            command: `${command} ${commandArgs.join(" ")}`,
            error: result.stderr,
            fix,
            source,
            applied: false,
          });
        }
      }
    }

    process.exit(result.exitCode);
  });

program.parse(process.argv);
