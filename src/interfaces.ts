export interface Config {
  openaiApiKey?: string;
  anthropicApiKey?: string; // New
  ollamaUrl?: string; // New
  provider?: "openai" | "anthropic" | "ollama"; // New
  model?: string; // New
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

export interface ErrorHandler {
  match(stderr: string): boolean;
  handle(stderr: string): string | null;
}
