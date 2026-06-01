# SmartShell MVP

A local CLI wrapper that intercepts errors from common commands (git, docker, npm, yarn, pnpm) and offers AI-generated fixes using OpenAI, Anthropic, Google Gemini, or Ollama.

## Features

- **Smart Error Interception**: Wraps `git`, `docker`, `npm`, `yarn`, `pnpm` and detects failures.
- **Multi-Provider Support**: Use **OpenAI**, **Anthropic**, **Google Gemini**, or **Ollama** (local LLM).
- **Interactive Fix Confirmation**: Prompts you to apply suggested fixes with one keypress.
- **Command History**: Tracks errors and fixes in `~/.smart-shell-history.json`.
- **Explain Mode**: Ask AI to explain any command or error using `smart explain`.
- **Setup Wizard**: `smart init` for guided configuration.
- **Configurable Timeouts**: Set custom timeout for AI requests.
- **Privacy-Focused**: Keys stored locally with restrictive permissions (600).

## Quick Start

```bash
# Install globally
npm install -g smart-shell

# Run setup wizard
smart init

# Start using
smart git commit -m "test"
```

## Installation

```bash
# Clone the repo
git clone https://github.com/RomanNebelskyi/Smart-Shell.git
cd smart-shell

# Install dependencies and build
npm install
npm run build

# Link globally
npm link
```

## Configuration

SmartShell supports multiple LLM providers. By default, it uses OpenAI.

### 1. Set your Provider

Use `openai` (default), `anthropic`, `gemini`, or `ollama`.

```bash
smart config set provider openai
smart config set provider anthropic
smart config set provider gemini
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

**Google Gemini:**

```bash
smart config set geminiApiKey AIza...
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

### 4. Advanced Configuration

**Timeout** (default: 10 seconds):

```bash
smart config set timeout 20
```

**Auto-run fixes** (skip confirmation prompt):

```bash
smart config set autoRun true
```

## Usage

### 🎯 Setup Wizard

First time? Run the interactive setup:

```bash
smart init
```

### 🛡️ Smart Wrapper

Prefix any command with `smart`. If it fails, SmartShell will analyze the error and suggest a fix.

```bash
smart git commit -m "wip"
# If it fails, you'll see:
# 💡 Suggested Fix: git add .
#    Run this fix? [Y/n]: y
# 🔧 Applying fix...
# ✅ Fix applied successfully!
```

### 🧠 Explain Mode

Want to know what a command does before running it? Or explain a complex error?

```bash
smart explain "git rebase -i HEAD~3"
# 📝 Explanation:
# This command starts an interactive rebase...
```

### 📜 Command History

View recent errors and fixes:

```bash
smart history           # Show last 10 entries
smart history -n 20     # Show last 20 entries
smart history --clear   # Clear history
```

## Built-in Error Handlers

SmartShell includes specialized error handlers for common CLI tools:

### Git

- No upstream configured → `git push --set-upstream origin <branch>`
- Merge conflicts → Resolve and commit
- Uncommitted changes → `git stash`
- Detached HEAD → `git checkout -b <new-branch>`
- Authentication failures
- Nothing to commit
- Not a git repository

### Docker

- Permission denied on socket → Add user to docker group
- Daemon not running → Start Docker service
- Image manifest not found
- Port already allocated
- No space left on device → `docker system prune`
- Dockerfile not found
- Container name conflict

### Node Package Managers (npm/yarn/pnpm)

- Missing script → List available scripts
- Cannot find module → Install missing dependency
- Permission denied → Fix directory permissions
- Peer dependency missing
- Yarn lockfile issues
- pnpm peer dependency errors

> **Note**: If no built-in handler matches, SmartShell automatically falls back to AI-powered suggestions.

## Security Features

SmartShell implements several security best practices:

- **API Key Masking**: Sensitive values are automatically masked in console output (e.g., `sk12...ab34`)
- **Input Validation**: All configuration values are validated before storage
  - Provider must be `openai`, `anthropic`, or `ollama`
  - URLs are validated and checked for HTTPS (warns on HTTP for remote servers)
  - API keys and models must be non-empty strings
- **Error Sanitization**: Error messages are sanitized by default. Set `SMART_DEBUG=1` to see full error details
- **Config File Permissions**: Configuration file is created with `600` permissions (owner-only read/write)
- **Command Injection Protection**: Uses `execa` with separated arguments to prevent shell injection
- **Schema Validation**: Config file structure is validated on load to prevent corruption

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
**Repo**: https://github.com/RomanNebelskyi/Smart-Shell
