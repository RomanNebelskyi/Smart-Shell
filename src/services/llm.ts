import type { LLMProvider, LLMRequest } from '../interfaces.js';
import { configService } from './config.js';

abstract class BaseLLMProvider implements LLMProvider {
  protected apiKey: string | undefined;
  protected model: string;
  protected apiUrl: string;

  constructor(apiKey: string | undefined, model: string, apiUrl: string) {
    this.apiKey = apiKey;
    this.model = model;
    this.apiUrl = apiUrl;
  }

  abstract generate(request: LLMRequest): Promise<string | null>;
}

class OpenAIProvider extends BaseLLMProvider {
  constructor(apiKey: string | undefined, model: string = 'gpt-4o-mini') {
    super(apiKey, model, 'https://api.openai.com/v1/chat/completions');
  }

  async generate(request: LLMRequest): Promise<string | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: request.systemPrompt },
            { role: 'user', content: request.userPrompt }
          ],
          max_tokens: 200,
          temperature: 0
        })
      });

      if (!response.ok) return null;
      const data = await response.json() as any;
      return data.choices?.[0]?.message?.content?.trim() || null;
    } catch (error) {
      if (process.env.SMART_DEBUG) {
        console.error('OpenAI API Error:', error);
      }
      return null;
    }
  }
}

class AnthropicProvider extends BaseLLMProvider {
    constructor(apiKey: string | undefined, model: string = 'claude-3-5-sonnet-20241022') {
        super(apiKey, model, 'https://api.anthropic.com/v1/messages');
    }

    async generate(request: LLMRequest): Promise<string | null> {
        if (!this.apiKey) return null;

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    system: request.systemPrompt,
                    messages: [
                        { role: 'user', content: request.userPrompt }
                    ],
                    max_tokens: 200
                })
            });

            if (!response.ok) return null;
            const data = await response.json() as any;
            return data.content?.[0]?.text?.trim() || null;
        } catch (error) {
            if (process.env.SMART_DEBUG) {
                console.error('Anthropic API Error:', error);
            }
            return null;
        }
    }
}

class OllamaProvider extends BaseLLMProvider {
    constructor(url: string = 'http://localhost:11434', model: string = 'llama3') {
        super(undefined, model, `${url}/api/generate`);
    }

    async generate(request: LLMRequest): Promise<string | null> {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt: `${request.systemPrompt}\n\nUser: ${request.userPrompt}\nAssistant:`,
                    stream: false
                })
            });

            if (!response.ok) return null;
            const data = await response.json() as any;
            return data.response?.trim() || null;
        } catch (error) {
             if (process.env.SMART_DEBUG) {
                 console.error('Ollama API Error:', error);
             }
            return null;
        }
    }
}

class GeminiProvider extends BaseLLMProvider {
    constructor(apiKey: string | undefined, model: string = 'gemini-2.0-flash-exp') {
        super(apiKey, model, 'https://generativelanguage.googleapis.com/v1beta/models');
    }

    async generate(request: LLMRequest): Promise<string | null> {
        if (!this.apiKey) return null;

        try {
            const response = await fetch(`${this.apiUrl}/${this.model}:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${request.systemPrompt}\n\n${request.userPrompt}`
                        }]
                    }]
                })
            });

            if (!response.ok) return null;
            const data = await response.json() as any;
            return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
        } catch (error) {
             if (process.env.SMART_DEBUG) {
                 console.error('Gemini API Error:', error);
             }
            return null;
        }
    }
}

export class LLMService {
  private provider: LLMProvider;

  constructor() {
    const providerType = configService.get('provider') || 'openai';
    const model = configService.get('model');

    switch (providerType) {
      case 'anthropic':
        this.provider = new AnthropicProvider(configService.get('anthropicApiKey'), model || 'claude-3-5-sonnet-latest');
        break;
      case 'gemini':
        this.provider = new GeminiProvider(configService.get('geminiApiKey'), model || 'gemini-2.0-flash-exp');
        break;
      case 'ollama':
        this.provider = new OllamaProvider(configService.get('ollamaUrl'), model || 'llama3');
        break;
      case 'openai':
      default:
        this.provider = new OpenAIProvider(configService.get('openaiApiKey'), model || 'gpt-4o-mini');
        break;
    }
  }

  async getFix(command: string, stderr: string): Promise<string | null> {
    return this.provider.generate({
      systemPrompt: 'You are a CLI expert. Provide a single line bash command to fix the error. Do not explain. Do not use markdown backticks.',
      userPrompt: `Command: ${command}\nError: ${stderr}`
    });
  }

  async explain(command: string, stderr?: string): Promise<string | null> {
    return this.provider.generate({
      systemPrompt: 'You are a helpful CLI assistant. Explain the following command clearly. If an error is provided, explain why it failed and how to fix it.',
      userPrompt: `Command: ${command}\n${stderr ? `Error: ${stderr}` : ''}`
    });
  }
}

export const llmService = new LLMService();
