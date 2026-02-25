export function handleGitError(stderr: string): string | null {
  const lowerStderr = stderr.toLowerCase();

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
  if (lowerStderr.includes("not a git repository")) {
    return "git init";
  }

  // Case 4: Merge conflicts
  if (/fix conflicts and then commit/i.test(stderr) || /CONFLICT \(content\)/i.test(stderr)) {
    return "git status  # View conflicts, then edit files, then: git add . && git commit";
  }

  // Case 5: Uncommitted changes preventing checkout/merge/rebase
  if (/your local changes.*would be overwritten/i.test(stderr)) {
    return "git stash  # Stash changes, retry command, then: git stash pop";
  }

  // Case 6: Detached HEAD
  if (/HEAD detached/i.test(stderr) || /detached HEAD/i.test(stderr)) {
    return "git checkout -b <new-branch-name>  # Save your work from detached HEAD";
  }

  // Case 7: Nothing to commit
  if (/nothing to commit/i.test(stderr) || /nothing added to commit/i.test(stderr)) {
    return "git add .  # Stage files before committing";
  }

  // Case 8: Authentication failure
  if (/authentication failed/i.test(stderr) || /could not read Username/i.test(stderr)) {
    return "Check your Git credentials or SSH key configuration (git remote -v to verify)";
  }

  // Case 9: Remote not found
  if (/remote origin already exists/i.test(stderr)) {
    return "git remote set-url origin <new-url>  # Update existing remote URL";
  }

  // Case 10: Branch already exists
  const branchExistsMatch = stderr.match(/a branch named ['"]?([^'"]+)['"]? already exists/i);
  if (branchExistsMatch) {
    return `git checkout ${branchExistsMatch[1]}  # Switch to existing branch`;
  }

  return null;
}
