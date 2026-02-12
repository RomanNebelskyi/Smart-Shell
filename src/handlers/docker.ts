export function handleDockerError(stderr: string): string | null {
  // Permission denied on Docker socket
  if (/permission denied/i.test(stderr) && /socket/i.test(stderr)) {
    return "Permission denied accessing Docker socket.\nTry: 'sudo usermod -aG docker $USER' (requires re-login), or use 'sudo docker ...'.";
  }

  // Docker daemon not running
  if (/Cannot connect to the Docker daemon/i.test(stderr)) {
    return "Docker daemon is not running.\nStart it with 'sudo systemctl start docker' (Linux) or open Docker Desktop (Mac/Windows).";
  }

  // Image manifest not found
  if (/manifest for .* not found/i.test(stderr)) {
    return "Image manifest not found. Check if the image name and tag are correct.";
  }

  // Port already allocated
  if (
    /port is already allocated/i.test(stderr) ||
    /Bind for .* failed/i.test(stderr)
  ) {
    return "Port is already allocated. Use 'docker ps' to find the conflicting container, or choose a different port.";
  }

  // No space left on device
  if (/no space left on device/i.test(stderr)) {
    return "No space left on device. Free up disk space:\n  docker system prune -a  (removes unused images, containers, networks)\n  docker volume prune     (removes unused volumes)";
  }

  // Dockerfile not found
  if (
    /unable to prepare context/i.test(stderr) ||
    /no such file or directory.*Dockerfile/i.test(stderr)
  ) {
    return "Dockerfile not found. Make sure you're in the correct directory or specify the path: docker build -f <path/to/Dockerfile> .";
  }

  // Container name already in use
  if (/is already in use by container/i.test(stderr)) {
    return "Container name is already in use. Remove the existing container: docker rm <container_name>, or use a different name.";
  }

  return null;
}
