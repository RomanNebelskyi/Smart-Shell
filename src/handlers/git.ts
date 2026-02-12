export function handleGitError(stderr: string): string | null {
  // Case 1: No upstream configured
  const upstreamMatch = stderr.match(
    /current branch ['"]?([^'\s]+)['"]? has no upstream/,
  );
  if (upstreamMatch?.[1]) {
    return `git push --set-upstream origin ${upstreamMatch[1]}`;
  }

  // Case 2: Pulling without reconciliation strategy
  if (stderr.includes("pulling without specifying how to reconcile")) {
    return "git config pull.rebase false";
  }

  // Case 3: Not a git repository
  if (stderr.toLowerCase().includes("not a git repository")) {
    return "git init";
  }

  // Case 4: Merge conflicts
  if (
    /fix conflicts and then commit/i.test(stderr) ||
    /CONFLICT \(content\)/i.test(stderr)
  ) {
    return "Merge conflict detected. Resolve conflicts in the listed files, then run: git add . && git commit";
  }

  // Case 5: Uncommitted changes preventing checkout/merge/rebase
  if (/your local changes.*would be overwritten/i.test(stderr)) {
    return "You have uncommitted changes. Stash them first: git stash, then retry your command, then: git stash pop";
  }

  // Case 6: Detached HEAD
  if (/HEAD detached/i.test(stderr) || /detached HEAD/i.test(stderr)) {
    return "You are in detached HEAD state. To save your work: git checkout -b <new-branch-name>";
  }

  // Case 7: Nothing to commit
  if (
    /nothing to commit/i.test(stderr) ||
    /nothing added to commit/i.test(stderr)
  ) {
    return "Nothing to commit. Stage files first: git add <file> or git add .";
  }

  // Case 8: Authentication failure
  if (
    /authentication failed/i.test(stderr) ||
    /could not read Username/i.test(stderr)
  ) {
    return "Authentication failed. Check your credentials or SSH key configuration.";
  }

  return null;
}
