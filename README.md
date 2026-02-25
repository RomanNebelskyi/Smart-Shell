# SmartShell MVP

A local CLI wrapper that intercepts errors from common commands (git, docker, npm, kubectl, terraform) and offers AI-generated fixes instantly.

## Features
- **Multi-Tool Support**: Wraps `git`, `docker`, `npm`, `yarn`, `pnpm`, `kubectl` (k), `terraform` (tf)
- **Smart Error Detection**: Detects non-zero exit codes and analyzes stderr
- **Built-in Handlers**: Instant fixes for 40+ common error patterns
- **AI Fallback**: Sends unknown errors to OpenAI for analysis when no handler matches
- **Real-time Output**: Streams command output live while monitoring for errors

## Installation
`npm install -g .` or `npm link`

## Supported Commands & Error Patterns

### Git (10+ patterns)
- No upstream branch → `git push --set-upstream origin <branch>`
- Pull reconciliation strategy → `git config pull.rebase false`
- Not a git repository → `git init`
- Merge conflicts → Resolution workflow
- Uncommitted changes blocking checkout → `git stash`
- Detached HEAD → `git checkout -b <branch>`
- Nothing to commit → `git add .`
- Authentication failures → Credential check
- Remote/branch conflicts → Switch or update

### Docker (9+ patterns)
- Permission denied on socket → Add user to docker group
- Daemon not running → Start Docker service
- Image manifest not found → Verify image/tag
- Port already allocated → Find/stop conflicting container
- No space left → `docker system prune -a`
- Dockerfile not found → Specify correct path
- Container name conflict → Remove or rename
- Container not running → Start container
- Network/volume not found → Create resources

### npm/yarn/pnpm (8+ patterns)
- Missing script → List available scripts
- Cannot find module → Install dependency
- Permission denied → Fix ownership
- Peer dependency missing → Install peer
- Lockfile outdated → Update lockfile
- pnpm peer issues → Bypass strict mode
- No package.json → Initialize project
- Corrupted node_modules → Clean reinstall

### kubectl/k (10+ patterns)
- Can't connect to server → Check cluster/minikube
- Resource not found → List available resources
- Namespace not found → Create namespace
- No pods found → Check all namespaces
- ImagePullBackOff → Check image/registry
- CrashLoopBackOff → View previous logs
- Permission denied → Check RBAC
- Invalid resource type → List API resources
- Context not set → Switch context

### terraform/tf (10+ patterns)
- Init required → `terraform init`
- State lock → Force unlock
- Provider not found → Reinitialize with upgrade
- Resource exists → Import resource
- Auth failure → Check cloud credentials
- Syntax error → Validate config
- Variable not set → Pass via -var or env
- Backend error → Reconfigure backend
- Resource in use → Targeted destroy

## Usage
`smart <command>`
```bash
smart git commit -m "wip"
# if error -> suggests fix

smart kubectl get pods
# if cluster unreachable -> suggests minikube start

smart terraform apply
# if state locked -> suggests force-unlock
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
