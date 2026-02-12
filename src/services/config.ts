import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { Config } from '../interfaces.js';

const SENSITIVE_KEYS = ['openaiApiKey', 'anthropicApiKey'] as const;
const VALID_PROVIDERS = ['openai', 'anthropic', 'ollama'] as const;

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
        const parsed = JSON.parse(data);
        return this.validateConfig(parsed);
      }
    } catch (error) {
      if (process.env.SMART_DEBUG) {
        console.error('Error loading config:', error);
      }
    }
    return {};
  }

  private validateConfig(config: any): Config {
    const validated: Config = {};
    
    if (config.provider && VALID_PROVIDERS.includes(config.provider)) {
      validated.provider = config.provider;
    }
    
    if (typeof config.openaiApiKey === 'string') {
      validated.openaiApiKey = config.openaiApiKey;
    }
    
    if (typeof config.anthropicApiKey === 'string') {
      validated.anthropicApiKey = config.anthropicApiKey;
    }
    
    if (typeof config.ollamaUrl === 'string') {
      validated.ollamaUrl = this.validateOllamaUrl(config.ollamaUrl);
    }
    
    if (typeof config.model === 'string' && config.model.trim()) {
      validated.model = config.model.trim();
    }
    
    return validated;
  }

  private validateOllamaUrl(url: string): string {
    try {
      const parsed = new URL(url);
      
      // Allow localhost with http or https
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        return url;
      }
      
      // For remote hosts, warn if using HTTP
      if (parsed.protocol === 'http:') {
        console.warn(`⚠️  Warning: Using unencrypted HTTP for remote Ollama server. Consider using HTTPS.`);
      }
      
      return url;
    } catch {
      throw new Error(`Invalid Ollama URL: ${url}`);
    }
  }

  private isSensitiveKey(key: string): boolean {
    return SENSITIVE_KEYS.includes(key as any);
  }

  private maskValue(key: string, value: any): string {
    if (this.isSensitiveKey(key) && typeof value === 'string') {
      if (value.length <= 8) return '***';
      return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
    }
    return String(value);
  }

  public get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  public getForDisplay<K extends keyof Config>(key: K): string {
    const value = this.config[key];
    if (value === undefined) return 'not set';
    return this.maskValue(key as string, value);
  }

  public set<K extends keyof Config>(key: K, value: Config[K]): void {
    // Validate input
    if (key === 'provider') {
      if (!VALID_PROVIDERS.includes(value as any)) {
        throw new Error(`Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}`);
      }
    }
    
    if (key === 'ollamaUrl') {
      value = this.validateOllamaUrl(value as string) as Config[K];
    }
    
    if ((key === 'openaiApiKey' || key === 'anthropicApiKey' || key === 'model') && typeof value === 'string') {
      if (!value.trim()) {
        throw new Error(`${key} cannot be empty`);
      }
    }
    
    this.config[key] = value;
    this.saveConfig();
  }

  private saveConfig(): void {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(this.config, null, 2), { mode: 0o600 });
    } catch (error) {
      if (process.env.SMART_DEBUG) {
        console.error('Error saving config:', error);
      } else {
        console.error('Failed to save configuration. Run with SMART_DEBUG=1 for details.');
      }
    }
  }

  public getApiKey(): string | undefined {
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
