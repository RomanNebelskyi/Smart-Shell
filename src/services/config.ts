import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { Config } from '../interfaces.js';

export class ConfigService {
  private configFile: string;
  private config: Config;

  constructor() {
    this.configFile = path.join(os.homedir(), '.smart-shell.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = fs.readFileSync(this.configFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      // console.error('Error loading config:', error);
    }
    return {};
  }

  public get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  public set<K extends keyof Config>(key: K, value: Config[K]): void {
    this.config[key] = value;
    this.saveConfig();
  }

  private saveConfig(): void {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2), { mode: 0o600 });
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  public getApiKey(): string | undefined {
      // Fallback logic could go here if we want to prioritize env vars
      const provider = this.config.provider || 'openai';
      if (provider === 'openai') {
        return process.env.OPENAI_API_KEY || this.config.openaiApiKey;
      }
      if (provider === 'anthropic') {
        return process.env.ANTHROPIC_API_KEY || this.config.anthropicApiKey;
      }
       return undefined;
  }
}

export const configService = new ConfigService();
