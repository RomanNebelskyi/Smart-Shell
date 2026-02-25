
export function handleDockerError(stderr: string): string | null {
  const lowerStderr = stderr.toLowerCase();

  // Permission denied on Docker socket
  if (/permission denied/i.test(stderr) && /socket/i.test(stderr)) {
    return "sudo usermod -aG docker $USER && newgrp docker  # Add user to docker group (requires re-login)";
  }

  // Docker daemon not running
  if (/Cannot connect to the Docker daemon/i.test(stderr)) {
    return "sudo systemctl start docker  # Start Docker daemon (Linux) or open Docker Desktop (Mac/Windows)";
  }

  // Image manifest not found
  if (/manifest for .* not found/i.test(stderr)) {
    return "docker pull <image:tag>  # Verify correct image name and tag exist";
  }

  // Port already allocated
  if (/port is already allocated/i.test(stderr) || /Bind for .* failed/i.test(stderr)) {
    return "docker ps  # Find conflicting container, then: docker stop <container>";
  }

  // No space left on device
  if (/no space left on device/i.test(stderr)) {
    return "docker system prune -a  # Clean up unused images, containers, and networks";
  }

  // Dockerfile not found
  if (/unable to prepare context/i.test(stderr) || /no such file.*dockerfile/i.test(lowerStderr)) {
    return "docker build -f <path/to/Dockerfile> .  # Specify correct Dockerfile path";
  }

  // Container name conflict
  if (/is already in use by container/i.test(stderr)) {
    const nameMatch = stderr.match(/container name "(.+?)"/i) || stderr.match(/is already in use by container "(.+?)"/i);
    const name = nameMatch ? nameMatch[1] : "<container>";
    return `docker rm ${name}  # Remove existing container, or use a different name`;
  }

  // Container not running
  if (/container .* is not running/i.test(stderr)) {
    return "docker start <container>  # Start the container first";
  }

  // Network not found
  if (/network .* not found/i.test(stderr)) {
    return "docker network ls  # List available networks, or create: docker network create <name>";
  }

  // Volume not found
  if (/volume .* not found/i.test(stderr)) {
    return "docker volume ls  # List volumes, or create: docker volume create <name>";
  }

  return null;
}
