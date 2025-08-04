// Export types
export type {
  VCSProvider,
  VCSProviderRegistry,
  LinkedProvider,
  ActiveInstallation,
  VCSDetectionResult,
  InstallationCheckResult
} from './types';

// Export providers
export { GitHubProvider } from './providers/github';
export { GitLabProvider } from './providers/gitlab';
export { BitbucketProvider } from './providers/bitbucket';
export { AzureProvider } from './providers/azure';

// Export registry
export { DefaultVCSProviderRegistry, vcsProviderRegistry } from './registry';

// Export service
export { VCSService, vcsService } from './service';
