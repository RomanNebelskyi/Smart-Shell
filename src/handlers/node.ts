type PackageManager = 'npm' | 'yarn' | 'pnpm';

/**
 * Maps a package manager command to its install equivalent.
 */
function installCmd(pm: PackageManager, pkg: string): string {
  switch (pm) {
    case 'yarn': return `yarn add ${pkg}`;
    case 'pnpm': return `pnpm add ${pkg}`;
    default:     return `npm install ${pkg}`;
  }
}

/**
 * Maps a package manager command to its "list scripts" equivalent.
 */
function listScriptsCmd(pm: PackageManager): string {
  switch (pm) {
    case 'yarn': return 'yarn run';
    case 'pnpm': return 'pnpm run';
    default:     return 'npm run';
  }
}

/**
 * Handles errors from npm, yarn, and pnpm.
 * Suggests fixes using the same package manager the user invoked.
 */
export function handleNodeError(command: string, stderr: string): string | null {
  const pm = command as PackageManager;

  // 1. Missing script (npm / yarn / pnpm)
  const missingScriptMatch =
    stderr.match(/missing script: (.+)/) ||          // npm
    stderr.match(/Command "(.+)" not found/) ||      // yarn classic
    stderr.match(/No script named "(.+)"/) ||        // pnpm
    stderr.match(/error Command "(.+)" not found/);  // yarn berry
  if (missingScriptMatch?.[1]) {
    return `Script '${missingScriptMatch[1]}' not found. Run '${listScriptsCmd(pm)}' to see available scripts.`;
  }

  // 2. Cannot find module
  const moduleMatch = stderr.match(/Cannot find module '(.+?)'/);
  if (moduleMatch?.[1]) {
    return `Module '${moduleMatch[1]}' is missing. Try: ${installCmd(pm, moduleMatch[1])}`;
  }

  // 3. EACCES / Permissions
  if (stderr.includes('EACCES: permission denied')) {
    return `Permission denied. Try running with elevated privileges or fix directory permissions.`;
  }

  // 4. Peer dependency missing
  const peerMatch = stderr.match(/peer dep(?:endency)? missing: ([^@\s]+)/i);
  if (peerMatch?.[1]) {
    return `Peer dependency '${peerMatch[1]}' is missing. Try: ${installCmd(pm, peerMatch[1])}`;
  }

  // 5. Yarn-specific: lockfile out of date
  if (pm === 'yarn' && /Your lockfile needs to be updated/i.test(stderr)) {
    return `Lockfile is out of date. Run 'yarn install' to update it.`;
  }

  // 6. pnpm-specific: ERR_PNPM_PEER_DEP_ISSUES
  if (pm === 'pnpm' && /ERR_PNPM_PEER_DEP_ISSUES/i.test(stderr)) {
    return `Peer dependency issues detected. Try: pnpm install --strict-peer-dependencies=false`;
  }

  // 7. Yarn berry: immutable install failed
  if (pm === 'yarn' && /YN0028/i.test(stderr)) {
    return `Immutable install failed. Your lockfile is outdated. Run 'yarn install' to regenerate it.`;
  }

  return null;
}
