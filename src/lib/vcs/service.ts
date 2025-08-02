import { 
  VCSDetectionResult, 
  InstallationCheckResult, 
  LinkedProvider, 
  ActiveInstallation 
} from './types';
import { VCSProviderType, RepositoryWithProvider } from '@/src/types';
import { vcsProviderRegistry } from './registry';

/**
 * VCS Service
 * Orchestrates the multi-VCS provider flow
 */
export class VCSService {
  /**
   * Step 2: VCS Provider Detection
   * Check which VCS providers the user has linked accounts for
   */
  async detectLinkedProviders(
    userId: string, 
    accountsCollection: any
  ): Promise<VCSDetectionResult> {
    const linkedProviders: LinkedProvider[] = [];
    const missingProviders: VCSProviderType[] = [];
    
    const allProviders = vcsProviderRegistry.getAllProviders();
    
    for (const provider of allProviders) {
      try {
        const account = await provider.checkLinkedAccount(userId, accountsCollection);
        
        if (account) {
          linkedProviders.push({
            provider: provider.name,
            account
          });
        } else {
          missingProviders.push(provider.name);
        }
      } catch (error) {
        console.error(`Error checking linked account for ${provider.name}:`, error);
        missingProviders.push(provider.name);
      }
    }

    return {
      linkedProviders,
      missingProviders
    };
  }

  /**
   * Step 4: Multi-Provider Installation Check
   * Check installation status for all linked providers
   */
  async checkInstallations(
    linkedProviders: LinkedProvider[],
    workspace: any,
    installationsCollection: any
  ): Promise<InstallationCheckResult> {
    const activeInstallations: ActiveInstallation[] = [];
    const installationUrls: Record<VCSProviderType, string> = {} as Record<VCSProviderType, string>;

    for (const { provider: providerName } of linkedProviders) {
      try {
        const provider = vcsProviderRegistry.getProvider(providerName);
        if (!provider) {
          console.error(`Provider ${providerName} not found in registry`);
          continue;
        }

        const installation = await provider.checkInstallation(workspace, installationsCollection);
        
        if (installation) {
          activeInstallations.push({
            provider: providerName,
            installation
          });
        } else {
          installationUrls[providerName] = provider.getInstallationUrl(workspace._id.toString());
        }
      } catch (error) {
        console.error(`Error checking installation for ${providerName}:`, error);
        // Add installation URL for failed checks
        const provider = vcsProviderRegistry.getProvider(providerName);
        if (provider) {
          installationUrls[providerName] = provider.getInstallationUrl(workspace._id.toString());
        }
      }
    }

    return {
      activeInstallations,
      installationUrls
    };
  }

  /**
   * Step 5: Provider-Specific Repository Fetching
   * Fetch repositories from all active installations
   */
  async fetchAllRepositories(
    activeInstallations: ActiveInstallation[],
    repositoriesCollection: any,
    workspaceId: string
  ): Promise<RepositoryWithProvider[]> {
    const allRepositories: RepositoryWithProvider[] = [];

    for (const { provider: providerName, installation } of activeInstallations) {
      try {
        const provider = vcsProviderRegistry.getProvider(providerName);
        if (!provider) {
          console.error(`Provider ${providerName} not found in registry`);
          continue;
        }

        const repositories = await provider.fetchRepositories(
          installation,
          repositoriesCollection,
          workspaceId
        );

        // Add provider metadata to repositories
        const repositoriesWithProvider = repositories.map(repo => ({
          ...repo,
          provider: providerName
        }));

        allRepositories.push(...repositoriesWithProvider);
      } catch (error) {
        console.error(`Error fetching repositories for ${providerName}:`, error);
        // Continue with other providers even if one fails
      }
    }

    // Sort repositories by creation date (newest first)
    return allRepositories.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get provider-specific error response for single provider scenarios
   */
  getProviderErrorResponse(
    providerName: VCSProviderType,
    errorType: 'no_account' | 'no_installation',
    workspaceId: string
  ): any {
    const provider = vcsProviderRegistry.getProvider(providerName);
    if (!provider) {
      return {
        error: `Provider ${providerName} not available`,
        message: `The ${providerName} provider is not currently available`
      };
    }

    return provider.getProviderSpecificErrorResponse(errorType, workspaceId);
  }
}

// Singleton instance for global use
export const vcsService = new VCSService();
