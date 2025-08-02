import { VCSProvider } from '../types';
import { VCSProviderType, VCSInstallation, Repository } from '@/src/types';
import { env } from '@/src/lib/config/environment';

/**
 * GitHub VCS Provider Implementation
 * Encapsulates all GitHub-specific logic from the original implementation
 */
export class GitHubProvider implements VCSProvider {
  readonly name: VCSProviderType = 'github';

  /**
   * Step 2: Check if user has linked GitHub account
   */
  async checkLinkedAccount(userId: string, accountsCollection: any): Promise<any | null> {
    return await accountsCollection.findOne({
      userId: userId,
      provider: 'github'
    });
  }

  /**
   * Step 4: Check if GitHub app is installed for workspace
   */
  async checkInstallation(workspace: any, installationsCollection: any): Promise<VCSInstallation | null> {
    const installation = await installationsCollection.findOne({
      $or: [
        { workspaceId: workspace._id.toString() },
        { userId: workspace.members?.[0]?.userId }
      ],
      provider: 'github',
      status: 'active'
    });

    return installation;
  }

  /**
   * Step 5: Fetch repositories for GitHub installation
   */
  async fetchRepositories(
    installation: VCSInstallation, 
    repositoriesCollection: any, 
    workspaceId: string
  ): Promise<Repository[]> {
    const repositories = await repositoriesCollection
      .find({
        workspaceId: workspaceId,
        vcsInstallationId: installation.installationId
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Transform MongoDB documents to Repository format
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
   * Get GitHub app installation URL
   */
  getInstallationUrl(workspaceId: string): string {
    return `https://github.com/apps/${env.GITHUB_APP_NAME}/installations/new?state=${workspaceId}`;
  }

  /**
   * Get GitHub-specific error responses
   */
  getProviderSpecificErrorResponse(errorType: 'no_account' | 'no_installation', workspaceId: string): any {
    if (errorType === 'no_account') {
      return {
        error: 'No GitHub account linked',
        message: 'Please link your GitHub account to access repositories',
        requiresGitHubAuth: true
      };
    }
    
    if (errorType === 'no_installation') {
      return {
        error: 'GitHub app not installed',
        message: 'Please install the Platyfend GitHub app to access your repositories',
        requiresGitHubAppInstall: true,
        installUrl: this.getInstallationUrl(workspaceId),
        workspaceId: workspaceId
      };
    }

    return {
      error: 'Unknown GitHub error',
      message: 'An unexpected error occurred with GitHub integration'
    };
  }
}
