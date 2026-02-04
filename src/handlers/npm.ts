export function handleNpmError(stderr: string): string | null {
  // 1. Missing script
  const missingScriptMatch = stderr.match(/missing script: (.+)/);
  if (missingScriptMatch) {
    return `Script '${missingScriptMatch[1]}' not found. Try running 'npm run' to see available scripts.`;
  }

  // 2. Cannot find module
  const moduleMatch = stderr.match(/Cannot find module '(.+?)'/);
  if (moduleMatch) {
    return `Module '${moduleMatch[1]}' is missing. Try running: npm install ${moduleMatch[1]}`;
  }

  // 3. EACCES / Permissions
  if (stderr.includes("EACCES: permission denied")) {
    return "Permission denied. Try running with sudo (e.g., 'sudo npm ...') or fix directory permissions.";
  }

  // 4. Peer dependency missing
  // Matches "peer dep missing: package-name@version" or similar
  const peerMatch = stderr.match(/peer dep(?:endency)? missing: ([^@\s]+)/i);
  if (peerMatch) {
    return `Peer dependency '${peerMatch[1]}' is missing. Try running: npm install ${peerMatch[1]}`;
  }
  
  return null;
}
