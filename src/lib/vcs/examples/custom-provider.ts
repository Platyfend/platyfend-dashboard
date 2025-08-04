import { VCSProvider } from '../types';
import { VCSProviderType, VCSInstallation, Repository } from '@/src/types';

/**
 * Example: Custom VCS Provider Implementation
 * This shows how to implement a new VCS provider
 */
export class CustomVCSProvider implements VCSProvider {
  readonly name: VCSProviderType = 'github'; // Replace with your provider

  /**
   * Step 2: Check if user has linked account for this provider
   */
  async checkLinkedAccount(userId: string, accountsCollection: any): Promise<any | null> {
    return await accountsCollection.findOne({
      userId: userId,
      provider: this.name // Your provider name
    });
  }

  /**
   * Step 4: Check if provider integration is installed for workspace
   */
  async checkInstallation(workspace: any, installationsCollection: any): Promise<VCSInstallation | null> {
    const installation = await installationsCollection.findOne({
      $or: [
        { workspaceId: workspace._id.toString() },
        { userId: workspace.members?.[0]?.userId }
      ],
      provider: this.name,
      status: 'active'
    });

    return installation;
  }

  /**
   * Step 5: Fetch repositories for this provider's installation
   */
  async fetchRepositories(
    installation: VCSInstallation, 
    repositoriesCollection: any, 
    workspaceId: string
  ): Promise<Repository[]> {
    // Implement your provider-specific repository fetching logic
    const repositories = await repositoriesCollection
      .find({
        workspaceId: workspaceId,
        vcsInstallationId: installation.installationId,
        provider: this.name
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Transform to standard Repository format
    return repositories.map((repo: any) => ({
      id: repo._id.toString(),
      name: repo.name,
      fullName: repo.fullName,
      description: repo.description,
      url: repo.url,
      isPrivate: repo.isPrivate,
      language: repo.language,
      stars: repo.stars || 0,
      forks: repo.forks || 0,
      externalId: repo.externalId,
      vcsInstallationId: repo.vcsInstallationId,
      workspaceId: repo.workspaceId,
      createdAt: repo.createdAt,
      updatedAt: repo.updatedAt
    }));
  }

  /**
   * Get installation URL for this provider
   */
  getInstallationUrl(workspaceId: string): string {
    // Return your provider's installation/authorization URL
    return `https://your-provider.com/oauth/authorize?state=${workspaceId}`;
  }

  /**
   * Get provider-specific error responses
   */
  getProviderSpecificErrorResponse(errorType: 'no_account' | 'no_installation', workspaceId: string): any {
    if (errorType === 'no_account') {
      return {
        error: 'No Custom Provider account linked',
        message: 'Please link your Custom Provider account to access repositories',
        requiresCustomAuth: true
      };
    }
    
    if (errorType === 'no_installation') {
      return {
        error: 'Custom Provider integration not configured',
        message: 'Please configure Custom Provider integration to access your repositories',
        requiresCustomAppInstall: true,
        installUrl: this.getInstallationUrl(workspaceId),
        workspaceId: workspaceId
      };
    }

    return {
      error: 'Unknown Custom Provider error',
      message: 'An unexpected error occurred with Custom Provider integration'
    };
  }
}

/**
 * Example: How to register a custom provider
 */
export function registerCustomProvider() {
  // Import the registry
  // import { vcsProviderRegistry } from '../registry';
  
  // Register your custom provider
  // vcsProviderRegistry.registerProvider(new CustomVCSProvider());
}
