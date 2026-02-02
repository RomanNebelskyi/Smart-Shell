# SmartShell MVP

A local CLI wrapper that intercepts errors from common commands (git, docker, npm) and offers AI-generated fixes instantly.

## Features
- Wraps `git`, `docker`, `npm`, `yarn`, `pnpm`
- Detects non-zero exit codes
- Sends stderr to LLM for analysis
- Proposes fixes with "Run this? [Y/n]"

## Usage
```bash
smart git commit -m "wip"
# if error -> suggests fix
```
