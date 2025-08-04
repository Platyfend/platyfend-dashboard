/**
 * Installation status utility functions
 * Shared utilities for handling installation status type guards and conversions
 */

// Type guard to safely convert string to installation status
export function isValidInstallationStatus(status: string | undefined): status is 'active' | 'pending' | 'suspended' | 'deleted' {
  return status === 'active' || status === 'pending' || status === 'suspended' || status === 'deleted';
}

// Safe converter function for installation status
export function toInstallationStatus(status: string | undefined): 'active' | 'pending' | 'suspended' | 'deleted' | undefined {
  if (!status) return undefined;
  return isValidInstallationStatus(status) ? status : undefined;
}
