import { capitalizeFirst } from "@/src/lib/utils";

/**
 * Get the display name for a VCS provider
 * @param provider - The provider type (github, gitlab, bitbucket, azure, etc.)
 * @returns The formatted display name
 */
export function getProviderDisplayName(provider?: string): string {
  if (!provider) return 'VCS';
  
  switch (provider.toLowerCase()) {
    case 'github':
      return 'GitHub';
    case 'gitlab':
      return 'GitLab';
    case 'bitbucket':
      return 'Bitbucket';
    case 'azure':
      return 'Azure DevOps';
    default:
      return capitalizeFirst(provider);
  }
}

/**
 * Get the provider icon component name or class
 * @param provider - The provider type
 * @returns Icon identifier for the provider
 */
export function getProviderIcon(provider?: string): string {
  if (!provider) return 'git-branch';
  
  switch (provider.toLowerCase()) {
    case 'github':
      return 'github';
    case 'gitlab':
      return 'gitlab';
    case 'bitbucket':
      return 'bitbucket';
    case 'azure':
      return 'azure';
    default:
      return 'git-branch';
  }
}

/**
 * Get provider-specific colors for UI elements
 * @param provider - The provider type
 * @returns Object with color classes
 */
export function getProviderColors(provider?: string) {
  if (!provider) return { primary: 'blue', secondary: 'gray' };
  
  switch (provider.toLowerCase()) {
    case 'github':
      return { primary: 'gray', secondary: 'slate' };
    case 'gitlab':
      return { primary: 'orange', secondary: 'amber' };
    case 'bitbucket':
      return { primary: 'blue', secondary: 'sky' };
    case 'azure':
      return { primary: 'blue', secondary: 'indigo' };
    default:
      return { primary: 'blue', secondary: 'gray' };
  }
}
