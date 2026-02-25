type PackageManager = "npm" | "yarn" | "pnpm";

function getInstallCmd(pm: PackageManager, pkg: string): string {
  switch (pm) {
    case "yarn": return `yarn add ${pkg}`;
    case "pnpm": return `pnpm add ${pkg}`;
    default: return `npm install ${pkg}`;
  }
}

function getRunCmd(pm: PackageManager): string {
  switch (pm) {
    case "yarn": return "yarn run";
    case "pnpm": return "pnpm run";
    default: return "npm run";
  }
}

export function handleNpmError(command: string, stderr: string): string | null {
  const pm = command as PackageManager;
  const lowerStderr = stderr.toLowerCase();

  // 1. Missing script (npm / yarn / pnpm patterns)
  const missingScriptMatch = 
    stderr.match(/missing script: (.+)/i) ||
    stderr.match(/Command "(.+)" not found/i) ||
    stderr.match(/No script named "(.+)"/i);
  if (missingScriptMatch?.[1]) {
    return `Script '${missingScriptMatch[1]}' not found. Try running '${getRunCmd(pm)}' to see available scripts.`;
  }

  // 2. Cannot find module
  const moduleMatch = stderr.match(/Cannot find module ['"](.+?)['"]/);
  if (moduleMatch?.[1]) {
    return `Module '${moduleMatch[1]}' is missing. Try running: ${getInstallCmd(pm, moduleMatch[1])}`;
  }

  // 3. EACCES / Permissions
  if (lowerStderr.includes("eacces") || lowerStderr.includes("permission denied")) {
    return "Permission denied. Try: sudo chown -R $(whoami) ~/.npm or fix directory permissions.";
  }

  // 4. Peer dependency missing
  const peerMatch = stderr.match(/peer dep(?:endency)? missing: ([^@\s]+)/i);
  if (peerMatch?.[1]) {
    return `Peer dependency '${peerMatch[1]}' is missing. Try running: ${getInstallCmd(pm, peerMatch[1])}`;
  }

  // 5. Lockfile outdated (yarn)
  if (/Your lockfile needs to be updated/i.test(stderr)) {
    return `${pm} install  # Update lockfile to match package.json`;
  }

  // 6. pnpm peer dependency issues
  if (/ERR_PNPM_PEER_DEP_ISSUES/i.test(stderr)) {
    return "pnpm install --strict-peer-dependencies=false  # Bypass peer dependency conflicts";
  }

  // 7. No package.json
  if (/could not read package\.json/i.test(lowerStderr) || /enoent.*package\.json/i.test(lowerStderr)) {
    return "npm init -y  # Initialize a new package.json in this directory";
  }

  // 8. Node modules corrupted
  if (/invalid json/i.test(lowerStderr) && lowerStderr.includes("node_modules")) {
    return "rm -rf node_modules package-lock.json && npm install  # Clean reinstall dependencies";
  }

  return null;
}
