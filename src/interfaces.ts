export interface Config {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  geminiApiKey?: string;
  ollamaUrl?: string;
  provider?: 'openai' | 'anthropic' | 'gemini' | 'ollama';
  model?: string;
  timeout?: number;
  autoRun?: boolean;
}

export interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
}

export interface LLMProvider {
  generate(request: LLMRequest): Promise<string | null>;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}
