export function handleTerraformError(stderr: string): string | null {
  const lowerStderr = stderr.toLowerCase();

  // Initialization required
  if (
    /terraform init/i.test(stderr) ||
    /please run "terraform init"/i.test(stderr)
  ) {
    return "terraform init  # Initialize working directory and download providers";
  }

  // State lock error
  if (/state lock/i.test(lowerStderr) || /locking state/i.test(lowerStderr)) {
    return "terraform force-unlock <LOCK_ID>  # Force unlock state (get LOCK_ID from error message)";
  }

  // Provider not found
  if (
    /provider.*not found/i.test(lowerStderr) ||
    /provider registry/i.test(lowerStderr)
  ) {
    return "terraform init -upgrade  # Reinitialize and upgrade providers to latest versions";
  }

  // Resource already exists
  if (/already exists/i.test(lowerStderr) || /already managed/i.test(lowerStderr)) {
    return "terraform import <resource_type>.<name> <resource_id>  # Import existing resource into state";
  }

  // Authentication failure
  if (
    /authentication failed/i.test(lowerStderr) ||
    /unauthorized/i.test(lowerStderr)
  ) {
    return "Check cloud provider credentials (AWS: aws configure, Azure: az login, GCP: gcloud auth)";
  }

  // Syntax error
  if (
    /syntax error/i.test(lowerStderr) ||
    /invalid hcl/i.test(lowerStderr) ||
    /parse error/i.test(lowerStderr)
  ) {
    return "terraform validate  # Validate configuration syntax and structure";
  }

  // Variable not defined
  if (
    /variable.*is not set/i.test(lowerStderr) ||
    /no value for required variable/i.test(lowerStderr)
  ) {
    const varMatch =
      stderr.match(/variable "([^"]+)"/i) || stderr.match(/var\.(\w+)/i);
    const varName = varMatch ? varMatch[1] : "<VAR>";
    return `terraform plan -var="${varName}=value"  # Or set via TF_VAR_${varName} environment variable`;
  }

  // Backend configuration error
  if (
    /backend.*error/i.test(lowerStderr) ||
    /failed to initialize backend/i.test(lowerStderr)
  ) {
    return "terraform init -reconfigure  # Reconfigure backend with new settings";
  }

  // Resource in use / dependency violation
  if (
    /resource.*in use/i.test(lowerStderr) ||
    /dependency violation/i.test(lowerStderr)
  ) {
    return "terraform destroy -target=<resource_type>.<name>  # Destroy dependent resources first, or use -target for specific resources";
  }

  return null;
}
