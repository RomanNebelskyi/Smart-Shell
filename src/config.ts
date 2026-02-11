import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';

const CONFIG_FILE = path.join(os.homedir(), '.smart-shell.json');

interface Config {
  openaiApiKey?: string;
}

export function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return {};
}

export function saveConfig(key: string, value: string): void {
  const config = loadConfig();
  if (key === 'openaiApiKey') {
    config.openaiApiKey = value;
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
  console.log(`✅ Config saved to ${CONFIG_FILE}`);
  console.log(chalk.yellow('⚠️  Security: File permissions set to 600 (owner-only). Environment variables are more secure for shared systems.'));
}

export function getApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY || loadConfig().openaiApiKey;
}
