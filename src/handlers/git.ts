export function handleGitError(stderr: string): string | null {
  // Case 1: No upstream configured
  // Error: fatal: The current branch <branch> has no upstream branch.
  const upstreamMatch = stderr.match(/current branch ['"]?([^'\s]+)['"]? has no upstream/);
  if (upstreamMatch && upstreamMatch[1]) {
    const branch = upstreamMatch[1];
    return `git push --set-upstream origin ${branch}`;
  }

  // Case 2: Pulling without reconciliation strategy
  if (stderr.includes("pulling without specifying how to reconcile")) {
    return "git config pull.rebase false";
  }

  // Case 3: Not a git repository
  if (stderr.toLowerCase().includes("not a git repository")) {
    return "git init";
  }

  return null;
}
