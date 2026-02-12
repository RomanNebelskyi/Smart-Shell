export interface Config {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  ollamaUrl?: string;
  provider?: 'openai' | 'anthropic' | 'ollama';
  model?: string;
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
