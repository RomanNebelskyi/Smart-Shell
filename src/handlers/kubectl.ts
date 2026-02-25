export function handleKubectlError(stderr: string): string | null {
  const lowerStderr = stderr.toLowerCase();

  // No connection to cluster
  if (
    /unable to connect to the server/i.test(stderr) ||
    /connection refused/i.test(lowerStderr)
  ) {
    return "kubectl cluster-info  # Check cluster connectivity, or start minikube: minikube start";
  }

  // Resource not found
  const notFoundMatch = stderr.match(
    /error from server \(notfound\): ([^"]+) "([^"]+)" not found/i,
  );
  if (notFoundMatch) {
    return `kubectl get ${notFoundMatch[1]}s  # List available ${notFoundMatch[1]}s in current namespace`;
  }

  // Namespace not found
  if (/namespace .* not found/i.test(stderr)) {
    const nsMatch = stderr.match(/namespace "([^"]+)"/i);
    const ns = nsMatch ? nsMatch[1] : "<namespace>";
    return `kubectl create namespace ${ns}  # Create the namespace first`;
  }

  // No pods found / selector mismatch
  if (/no resources found/i.test(lowerStderr)) {
    return "kubectl get pods --all-namespaces  # Check pods in all namespaces, or verify your selector labels";
  }

  // Image pull errors
  if (
    /imagepullbackoff/i.test(lowerStderr) ||
    /errimagepull/i.test(lowerStderr)
  ) {
    return "kubectl describe pod <pod-name>  # Check image name, tag, and registry authentication";
  }

  // CrashLoopBackOff
  if (/crashloopbackoff/i.test(lowerStderr)) {
    return "kubectl logs <pod-name> --previous  # Check previous container logs for crash details";
  }

  // Permission denied
  if (/forbidden/i.test(lowerStderr) || /unauthorized/i.test(lowerStderr)) {
    return "kubectl auth can-i <verb> <resource>  # Check permissions, or contact cluster admin for RBAC access";
  }

  // Invalid resource type
  if (/the server doesn't have a resource type/i.test(lowerStderr)) {
    const resourceMatch = stderr.match(/resource type "([^"]+)"/i);
    const resource = resourceMatch ? resourceMatch[1] : "<resource>";
    return `kubectl api-resources | grep ${resource}  # Check available resource types and their shortnames`;
  }

  // Context not set
  if (/current context is not set/i.test(lowerStderr)) {
    return "kubectl config get-contexts  # List contexts, then: kubectl config use-context <context-name>";
  }

  return null;
}
