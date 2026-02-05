
export function handleDockerError(stderr: string): string | null {
  if (/permission denied/i.test(stderr) && /socket/i.test(stderr)) {
    return "Permission denied accessing Docker socket.\nTry adding your user to the docker group: 'sudo usermod -aG docker $USER' (requires re-login), or use 'sudo docker ...'.";
  }
  
  if (/Cannot connect to the Docker daemon/i.test(stderr)) {
    return "Docker daemon is not running.\nTry starting it with 'sudo systemctl start docker' (Linux) or open Docker Desktop (Mac/Windows).";
  }

  if (/manifest for .* not found/i.test(stderr)) {
    return "Image manifest not found.\nCheck if the image name and tag are correct.";
  }

  if (/port is already allocated/i.test(stderr) || /Bind for .* failed/i.test(stderr)) {
    return "Port is already allocated.\nUse 'docker ps' to find the conflicting container, or choose a different port.";
  }

  return null;
}
