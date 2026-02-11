# SmartShell MVP

A local CLI wrapper that intercepts errors from common commands (git, docker, npm) and offers AI-generated fixes instantly. Now with support for multiple LLM providers and an "Explain Mode".

## Features

- **Smart Error Interception**: Wraps `git`, `docker`, `npm`, `yarn`, `pnpm` and detects failures.
- **Multi-Provider Support**: Use **OpenAI**, **Anthropic**, or **Ollama** (local LLM).
- **Explain Mode**: Ask AI to explain any command or error using `smart explain`.
- **Privacy-Focused**: Keys stored locally with restrictive permissions (600).

## Installation

```bash
# Clone the repo
git clone https://github.com/Romannebelskyipz/smart-shell-mvp.git
cd smart-shell-mvp

# Install dependencies and build
npm install
npm run build

# Link globally
npm link
```

## Configuration

SmartShell supports multiple LLM providers. By default, it uses OpenAI.

### 1. Set your Provider

Use `openai` (default), `anthropic`, or `ollama`.

```bash
smart config set provider openai
smart config set provider anthropic
smart config set provider ollama
```

### 2. Set API Keys

Depending on your provider, set the appropriate API key.

**OpenAI:**

```bash
smart config set openaiApiKey sk-...
```

**Anthropic:**

```bash
smart config set anthropicApiKey sk-ant-...
```

**Ollama:**
No API key required. By default, it connects to `http://localhost:11434` and uses `llama3`.
You can customize the URL or model:

```bash
smart config set ollamaUrl http://localhost:11434
smart config set model llama3
```

### 3. View Configuration

Check your current settings:

```bash
smart config get provider
smart config get model
```

## Usage

### 🛡️ Smart Wrapper

Prefix any command with `smart`. If it fails, SmartShell will analyze the error and suggest a fix.

```bash
smart git commit -m "wip"
# If it fails, you'll see:
# 💡 Suggested Fix: ...
# 🤖 AI Suggestion: ...
```

### 🧠 Explain Mode

Want to know what a command does before running it? Or explain a complex error?

```bash
smart explain "git rebase -i HEAD~3"
# 📝 Explanation:
# This command starts an interactive rebase...
```

## Security & Privacy

- **Local Storage**: API keys are stored in `~/.smart-shell.json` with **600 permissions** (read/write by owner only).
- **No Data Collection**: Error logs and prompts are sent _only_ to the configured LLM provider for analysis.
- **Environment Variables**: You can also use standard environment variables (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) instead of the config file.

## Development

```bash
# Run tests
npm test

# Build
npm run build

# Run locally
npm start -- <args>
```

---

**License**: MIT
**Repo**: https://github.com/Romannebelskyipz/smart-shell-mvp
