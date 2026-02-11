# SmartShell MVP

A local CLI wrapper that intercepts errors from common commands (git, docker, npm) and offers AI-generated fixes instantly.

## Features
- Wraps `git`, `docker`, `npm`, `yarn`, `pnpm`
- Detects non-zero exit codes
- Sends stderr to LLM for analysis
- Proposes fixes with "Run this? [Y/n]"

## Installation
`npm install -g .` or `npm link`

## Usage
`smart <command>`
```bash
smart git commit -m "wip"
# if error -> suggests fix
```

## Configuration
Set your OpenAI API key:
```bash
smart config --key sk-your-key-here
```

## Security
- **API keys are stored in `~/.smart-shell.json`** with 600 permissions (owner-only)
- **Plain text storage**: Keys are not encrypted at rest
- **Recommendation**: Use environment variables (`OPENAI_API_KEY`) on shared systems for better security
- **File location**: `~/.smart-shell.json` - ensure your home directory has proper permissions (700)

⚠️ **Warning**: Never commit API keys to version control. The `.gitignore` already excludes config files, but always verify before pushing to public repos.

### Security Best Practices
1. Prefer environment variables: `export OPENAI_API_KEY=sk-...`
2. If using config file, ensure `~/.smart-shell.json` has 600 permissions
3. Rotate API keys regularly
4. Use separate keys for different projects/environments
5. Monitor API usage in your OpenAI dashboard for unexpected activity

## Privacy
- Error messages are sent to OpenAI's API for analysis
- No other data is transmitted
- All processing happens locally except LLM API calls
- Review OpenAI's privacy policy for data retention details

---

**License**: MIT  
**Repo**: https://github.com/Romannebelskyipz/smart-shell-mvp
