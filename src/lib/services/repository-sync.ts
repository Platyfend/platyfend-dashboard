import { githubAppAuth } from '@/src/lib/github/app-auth';
import { Organization, InstallationStatus, IRepository } from '@/src/lib/database/models';

export interface SyncResult {
  success: boolean;
  organizationId: string;
  summary: {
    total: number;
    added: number;
    updated: number;
    removed: number;
    errors: number;
  };
  errors: Array<{
    repository?: string;
    error: string;
    timestamp: Date;
  }>;
}

export interface RepositoryMetadata {
  repo_id: string;
  name: string;
  full_name: string;
  private: boolean;
  description?: string;
  language?: string;
  stars: number;
  forks: number;
  default_branch: string;
  url: string;
  installation_id: string;
  permissions: string[];
}

/**
 * Repository Synchronization Service
 * Handles syncing repositories from GitHub App installations to MongoDB
 */
export class RepositorySyncService {
  
  /**
   * Sync all repositories for a specific organization
   */
  async syncOrganizationRepositories(organizationId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      organizationId,
      summary: { total: 0, added: 0, updated: 0, removed: 0, errors: 0 },
      errors: []
    };

    try {
      // Find the organization
      const organization = await Organization.findOne({ org_id: organizationId });
      if (!organization) {
        throw new Error(`Organization not found: ${organizationId}`);
      }

      if (organization.installation_status !== InstallationStatus.ACTIVE) {
        throw new Error(`Organization installation is not active: ${organization.installation_status}`);
      }

      // Get repositories from GitHub
      const githubRepos = await this.fetchGitHubRepositories(organization.installation_id);
      result.summary.total = githubRepos.length;

      // Get current repositories in organization
      const currentRepoIds = new Set(organization.repos.map((repo: IRepository) => repo.repo_id));
      const githubRepoIds = new Set(githubRepos.map((repo: RepositoryMetadata) => repo.repo_id));

      // Find repositories to add, update, and remove
      const reposToAdd = githubRepos.filter((repo: RepositoryMetadata) => !currentRepoIds.has(repo.repo_id));
      const reposToUpdate = githubRepos.filter((repo: RepositoryMetadata) => currentRepoIds.has(repo.repo_id));
      const repoIdsToRemove = Array.from(currentRepoIds).filter((repoId) => !githubRepoIds.has(repoId as string));

      // Remove repositories that are no longer accessible
      for (const repoId of repoIdsToRemove) {
        try {
          await organization.removeRepository(repoId as string);
          result.summary.removed++;
        } catch (error) {
          result.errors.push({
            repository: repoId as string,
            error: `Failed to remove repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date()
          });
          result.summary.errors++;
        }
      }

      // Add new repositories
      for (const repoData of reposToAdd) {
        try {
          await organization.addRepository(repoData);
          result.summary.added++;
        } catch (error) {
          result.errors.push({
            repository: repoData.name,
            error: `Failed to add repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date()
          });
          result.summary.errors++;
        }
      }

      // Update existing repositories
      for (const repoData of reposToUpdate) {
        try {
          await this.updateRepositoryMetadata(organization, repoData);
          result.summary.updated++;
        } catch (error) {
          result.errors.push({
            repository: repoData.name,
            error: `Failed to update repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date()
          });
          result.summary.errors++;
        }
      }

      // Update organization metadata
      organization.total_repos = githubRepos.length;
      organization.public_repos = githubRepos.filter((repo: RepositoryMetadata) => !repo.private).length;
      organization.private_repos = githubRepos.filter((repo: RepositoryMetadata) => repo.private).length;
      organization.updated_at = new Date();

      await organization.save();

      result.success = result.summary.errors === 0;

      console.log(`Repository sync completed for organization ${organizationId}:`, result.summary);
      
      return result;

    } catch (error) {
      result.errors.push({
        error: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      });
      result.summary.errors++;
      
      console.error(`Repository sync failed for organization ${organizationId}:`, error);
      return result;
    }
  }

  /**
   * Sync a single repository by ID
   */
  async syncSingleRepository(organizationId: string, repoId: string): Promise<boolean> {
    try {
      const organization = await Organization.findOne({ org_id: organizationId });
      if (!organization) {
        throw new Error(`Organization not found: ${organizationId}`);
      }

      // Get single repository from GitHub (efficient API call)
      const githubRepo = await this.fetchSingleGitHubRepository(organization.installation_id, repoId);

      if (!githubRepo) {
        // Repository no longer exists, remove it
        await organization.removeRepository(repoId);
        console.log(`Removed repository ${repoId} from organization ${organizationId}`);
        return true;
      }

      // Check if repository exists in organization
      const existingRepo = organization.repos.find((repo: IRepository) => repo.repo_id === repoId);

      if (existingRepo) {
        // Update existing repository
        await this.updateRepositoryMetadata(organization, githubRepo);
        console.log(`Updated repository ${repoId} in organization ${organizationId}`);
      } else {
        // Add new repository
        await organization.addRepository(githubRepo);
        console.log(`Added repository ${repoId} to organization ${organizationId}`);
      }

      return true;

    } catch (error) {
      console.error(`Failed to sync repository ${repoId} for organization ${organizationId}:`, error);
      return false;
    }
  }

  /**
   * Fetch repositories from GitHub App installation
   */
  private async fetchGitHubRepositories(installationId: string): Promise<RepositoryMetadata[]> {
    try {
      const repositories = await githubAppAuth.getInstallationRepositories(installationId);

      return repositories.map((repo: any) => ({
        repo_id: repo.id.toString(),
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        description: repo.description || undefined,
        language: repo.language || undefined,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        default_branch: repo.default_branch || 'main',
        url: repo.html_url,
        installation_id: installationId,
        permissions: repo.permissions ? Object.keys(repo.permissions) : ['read']
      }));

    } catch (error) {
      console.error(`Failed to fetch repositories for installation ${installationId}:`, error);
      throw new Error(`GitHub API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch a single repository from GitHub App installation
   * Returns null if repository is not found (404), throws for other errors
   */
  private async fetchSingleGitHubRepository(installationId: string, repoId: string): Promise<RepositoryMetadata | null> {
    try {
      const repo = await githubAppAuth.getSingleRepository(installationId, repoId);

      if (!repo) {
        return null;
      }

      return {
        repo_id: repo.id.toString(),
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        description: repo.description || undefined,
        language: repo.language || undefined,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        default_branch: repo.default_branch || 'main',
        url: repo.html_url,
        installation_id: installationId,
        permissions: repo.permissions ? Object.keys(repo.permissions) : ['read']
      };

    } catch (error) {
      console.error(`Failed to fetch repository ${repoId} for installation ${installationId}:`, error);
      throw new Error(`GitHub API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update repository metadata in organization
   */
  private async updateRepositoryMetadata(organization: any, repoData: RepositoryMetadata): Promise<void> {
    const existingRepo = organization.repos.find((repo: IRepository) => repo.repo_id === repoData.repo_id);
    
    if (existingRepo) {
      // Update metadata while preserving added_at timestamp
      existingRepo.name = repoData.name;
      existingRepo.full_name = repoData.full_name;
      existingRepo.private = repoData.private;
      existingRepo.description = repoData.description;
      existingRepo.language = repoData.language;
      existingRepo.stars = repoData.stars;
      existingRepo.forks = repoData.forks;
      existingRepo.default_branch = repoData.default_branch;
      existingRepo.url = repoData.url;
      existingRepo.permissions = repoData.permissions;
      existingRepo.last_sync = new Date();

      await organization.save();
    }
  }

  /**
   * Get sync status for an organization
   */
  async getSyncStatus(organizationId: string): Promise<{
    canSync: boolean;
    lastSync?: Date;
    repositoryCount: number;
    installationStatus: string;
  }> {
    try {
      const organization = await Organization.findOne({ org_id: organizationId });
      
      if (!organization) {
        return {
          canSync: false,
          repositoryCount: 0,
          installationStatus: 'not_found'
        };
      }

      return {
        canSync: organization.installation_status === InstallationStatus.ACTIVE,
        lastSync: organization.updated_at,
        repositoryCount: organization.repos.length,
        installationStatus: organization.installation_status
      };

    } catch (error) {
      console.error(`Failed to get sync status for organization ${organizationId}:`, error);
      return {
        canSync: false,
        repositoryCount: 0,
        installationStatus: 'error'
      };
    }
  }
}

// Singleton instance
export const repositorySyncService = new RepositorySyncService();

// Helper functions for common operations
export async function syncOrganizationRepositories(organizationId: string): Promise<SyncResult> {
  return repositorySyncService.syncOrganizationRepositories(organizationId);
}

export async function syncSingleRepository(organizationId: string, repoId: string): Promise<boolean> {
  return repositorySyncService.syncSingleRepository(organizationId, repoId);
}

export async function getSyncStatus(organizationId: string) {
  return repositorySyncService.getSyncStatus(organizationId);
}
