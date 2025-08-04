import { Organization, InstallationStatus } from '@/src/lib/database/models';

export interface WebhookSyncResult {
  success: boolean;
  action: string;
  organizationId?: string;
  repositoriesAffected: number;
  errors: string[];
}

/**
 * Webhook-driven synchronization service
 * Handles real-time updates from GitHub webhooks
 */
export class WebhookSyncService {

  /**
   * Handle installation webhook events
   */
  async handleInstallationEvent(payload: any): Promise<WebhookSyncResult> {
    const { action, installation, repositories, repository_selection } = payload;
    const installationId = installation.id.toString();

    const result: WebhookSyncResult = {
      success: false,
      action: `installation.${action}`,
      repositoriesAffected: 0,
      errors: []
    };

    try {
      switch (action) {
        case 'created':
          await this.handleInstallationCreated(installationId, installation, repositories, repository_selection, result);
          break;

        case 'deleted':
          await this.handleInstallationDeleted(installationId, installation, result);
          break;

        case 'suspend':
          await this.handleInstallationSuspended(installationId, installation, result);
          break;

        case 'unsuspend':
          await this.handleInstallationUnsuspended(installationId, installation, result);
          break;

        default:
          result.errors.push(`Unhandled installation action: ${action}`);
      }

      console.log(`Installation webhook processed:`, {
        action,
        installationId,
        repositorySelection: repository_selection,
        repositoriesAffected: result.repositoriesAffected,
        success: result.success,
        errors: result.errors
      });

      return result;

    } catch (error) {
      result.errors.push(`Installation webhook error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(`Installation webhook failed:`, error);
      return result;
    }
  }

  /**
   * Handle installation repositories webhook events
   */
  async handleInstallationRepositoriesEvent(payload: any): Promise<WebhookSyncResult> {
    const { action, installation, repositories_added, repositories_removed } = payload;
    const installationId = installation.id.toString();

    const result: WebhookSyncResult = {
      success: false,
      action: `installation_repositories.${action}`,
      repositoriesAffected: 0,
      errors: []
    };

    try {
      // Find organization by installation ID
      const organization = await Organization.findOne({
        installation_id: installationId,
        installation_status: InstallationStatus.ACTIVE
      });

      if (!organization) {
        result.errors.push(`No active organization found for installation ${installationId}`);
        return result;
      }

      result.organizationId = organization._id.toString();

      switch (action) {
        case 'added':
          if (repositories_added && repositories_added.length > 0) {
            await this.handleRepositoriesAdded(organization, repositories_added, installationId, result);
          }
          break;

        case 'removed':
          if (repositories_removed && repositories_removed.length > 0) {
            await this.handleRepositoriesRemoved(organization, repositories_removed, result);
          }
          break;

        default:
          result.errors.push(`Unhandled installation repositories action: ${action}`);
      }

      console.log(`Installation repositories webhook processed:`, {
        action,
        installationId,
        organizationId: result.organizationId,
        repositoriesAffected: result.repositoriesAffected,
        success: result.success,
        errors: result.errors
      });

      return result;

    } catch (error) {
      result.errors.push(`Installation repositories webhook error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(`Installation repositories webhook failed:`, error);
      return result;
    }
  }

  /**
   * Handle repository webhook events
   */
  async handleRepositoryEvent(payload: any): Promise<WebhookSyncResult> {
    const { action, repository } = payload;
    const repoId = repository.id.toString();

    const result: WebhookSyncResult = {
      success: false,
      action: `repository.${action}`,
      repositoriesAffected: 0,
      errors: []
    };

    try {
      // Find organizations that have this repository
      const organizations = await Organization.find({
        'repos.repo_id': repoId
      });

      if (organizations.length === 0) {
        console.log(`No organizations found with repository ${repoId}`);
        result.success = true;
        return result;
      }

      for (const organization of organizations) {
        try {
          switch (action) {
            case 'renamed':
              await this.handleRepositoryRenamed(organization, repoId, repository, result);
              break;

            case 'transferred':
              await this.handleRepositoryTransferred(organization, repoId, repository, result);
              break;

            case 'privatized':
            case 'publicized':
              await this.handleRepositoryVisibilityChanged(organization, repoId, repository, result);
              break;

            case 'deleted':
              await this.handleRepositoryDeleted(organization, repoId, result);
              break;

            default:
              console.log(`Unhandled repository action: ${action} for repo ${repoId}`);
          }
        } catch (error) {
          result.errors.push(`Failed to update repository ${repoId} in organization ${organization._id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      result.success = result.errors.length === 0;

      console.log(`Repository webhook processed:`, {
        action,
        repoId,
        organizationsAffected: organizations.length,
        repositoriesAffected: result.repositoriesAffected,
        success: result.success,
        errors: result.errors
      });

      return result;

    } catch (error) {
      result.errors.push(`Repository webhook error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(`Repository webhook failed:`, error);
      return result;
    }
  }

  /**
   * Handle installation created
   */
  private async handleInstallationCreated(
    installationId: string,
    installation: any,
    repositories: any[] | undefined,
    repository_selection: string | undefined,
    result: WebhookSyncResult
  ): Promise<void> {
    // Extract organization ID from the installation account
    const account = installation.account;
    const githubAccountId = account?.id?.toString();

    if (githubAccountId) {
      result.organizationId = githubAccountId;
    }

    console.log(`Installation ${installationId} created:`, {
      repositorySelection: repository_selection,
      repositoriesCount: repositories?.length || 0,
      accountType: account?.type,
      accountLogin: account?.login
    });

    // Find the organization by GitHub account ID (org_id), not installation_id
    // since the organization was created during OAuth with org_id but no installation_id
    let organization = null;
    if (githubAccountId) {
      try {
        organization = await Organization.findOne({
          org_id: githubAccountId,
          provider: 'github'
        });

        if (organization) {
          // Update the organization with the installation_id and set status to active
          organization.installation_id = installationId;
          organization.installation_status = InstallationStatus.ACTIVE;
          organization.updated_at = new Date();
          await organization.save();

          console.log(`Updated organization ${organization._id} with installation_id ${installationId}`);
        } else {
          console.log(`No organization found for GitHub account ${githubAccountId} - organization may not exist yet`);
        }
      } catch (error) {
        console.error(`Error finding/updating organization for GitHub account ${githubAccountId}:`, error);
        result.errors.push(`Failed to find organization for GitHub account ${githubAccountId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // If repositories are provided in the webhook (for selected repositories),
    // we can sync them here. For "all" repositories, we'll need to fetch them via API
    if (repositories && repositories.length > 0 && organization) {
      try {
        await this.handleRepositoriesAdded(organization, repositories, installationId, result);
        console.log(`Synced ${repositories.length} repositories from installation webhook`);
      } catch (error) {
        console.error(`Error syncing repositories from installation webhook:`, error);
        result.errors.push(`Failed to sync repositories: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else if (repository_selection === 'all') {
      console.log(`Installation ${installationId} has access to all repositories - will be synced via callback or API fetch`);
    }

    result.success = true;
  }

  /**
   * Handle installation deleted
   */
  private async handleInstallationDeleted(installationId: string, installation: any, result: WebhookSyncResult): Promise<void> {
    // Extract organization ID from the installation account
    const account = installation.account;
    const githubAccountId = account?.id?.toString();

    if (githubAccountId) {
      result.organizationId = githubAccountId;
    }

    // Update organization by installation_id (since it should be set by now)
    const updateResult = await Organization.updateMany(
      { installation_id: installationId },
      {
        installation_status: InstallationStatus.DELETED,
        installation_id: null, // Clear the installation_id
        updated_at: new Date()
      }
    );

    result.repositoriesAffected = updateResult.modifiedCount;
    result.success = true;
    console.log(`Marked ${updateResult.modifiedCount} organizations as deleted for installation ${installationId}`);
  }

  /**
   * Handle installation suspended
   */
  private async handleInstallationSuspended(installationId: string, installation: any, result: WebhookSyncResult): Promise<void> {
    // Extract organization ID from the installation account
    const account = installation.account;
    const githubAccountId = account?.id?.toString();

    if (githubAccountId) {
      result.organizationId = githubAccountId;
    }

    const updateResult = await Organization.updateMany(
      { installation_id: installationId },
      {
        installation_status: InstallationStatus.SUSPENDED,
        updated_at: new Date()
      }
    );

    result.repositoriesAffected = updateResult.modifiedCount;
    result.success = true;
    console.log(`Marked ${updateResult.modifiedCount} organizations as suspended for installation ${installationId}`);
  }

  /**
   * Handle installation unsuspended
   */
  private async handleInstallationUnsuspended(installationId: string, installation: any, result: WebhookSyncResult): Promise<void> {
    // Extract organization ID from the installation account
    const account = installation.account;
    const githubAccountId = account?.id?.toString();

    if (githubAccountId) {
      result.organizationId = githubAccountId;
    }

    const updateResult = await Organization.updateMany(
      { installation_id: installationId },
      {
        installation_status: InstallationStatus.ACTIVE,
        updated_at: new Date()
      }
    );

    result.repositoriesAffected = updateResult.modifiedCount;
    result.success = true;
    console.log(`Marked ${updateResult.modifiedCount} organizations as active for installation ${installationId}`);
  }

  /**
   * Handle repositories added to installation
   */
  private async handleRepositoriesAdded(
    organization: any,
    repositories: any[],
    installationId: string,
    result: WebhookSyncResult
  ): Promise<void> {
    try {
      // Transform all repositories to our format
      const currentTime = new Date()
      const newRepos = repositories.map((repo: any) => {
        // Map GitHub permissions to our allowed permissions
        const githubPerms = repo.permissions || {}
        const mappedPermissions: string[] = []

        if (githubPerms.admin) mappedPermissions.push('admin')
        else if (githubPerms.push) mappedPermissions.push('write')
        else mappedPermissions.push('read')

        if (githubPerms.pull) mappedPermissions.push('pull_requests')
        if (githubPerms.issues) mappedPermissions.push('issues')
        mappedPermissions.push('metadata') // Always include metadata

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
          permissions: [...new Set(mappedPermissions)], // Remove duplicates
          added_at: currentTime,
          last_sync: currentTime
        }
      })

      // Get current repos and add new ones
      const currentRepos = organization.repos || []
      const updatedRepos = [...currentRepos, ...newRepos]

      // Update organization with new repositories using simple update
      await Organization.findByIdAndUpdate(
        organization._id,
        {
          $set: {
            repos: updatedRepos,
            total_repos: updatedRepos.length,
            public_repos: updatedRepos.filter((repo: any) => !repo.private).length,
            private_repos: updatedRepos.filter((repo: any) => repo.private).length,
            updated_at: currentTime
          }
        },
        { new: true, runValidators: true }
      )

      result.repositoriesAffected = newRepos.length
      result.success = true
      console.log(`Added ${result.repositoriesAffected} repositories to organization ${organization._id}`)

    } catch (error) {
      result.errors.push(`Failed to add repositories: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Error adding repositories via webhook:', error)
    }
  }

  /**
   * Handle repositories removed from installation
   */
  private async handleRepositoriesRemoved(
    organization: any, 
    repositories: any[], 
    result: WebhookSyncResult
  ): Promise<void> {
    for (const repo of repositories) {
      try {
        await organization.removeRepository(repo.id.toString());
        result.repositoriesAffected++;
      } catch (error) {
        result.errors.push(`Failed to remove repository ${repo.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    result.success = result.errors.length === 0;
    console.log(`Removed ${result.repositoriesAffected} repositories from organization ${organization._id}`);
  }

  /**
   * Handle repository renamed
   */
  private async handleRepositoryRenamed(
    organization: any, 
    repoId: string, 
    repository: any, 
    result: WebhookSyncResult
  ): Promise<void> {
    const updateResult = await Organization.updateOne(
      { 
        _id: organization._id,
        'repos.repo_id': repoId 
      },
      {
        $set: {
          'repos.$.name': repository.name,
          'repos.$.full_name': repository.full_name,
          'repos.$.last_sync': new Date(),
          updated_at: new Date()
        }
      }
    );

    if (updateResult.modifiedCount > 0) {
      result.repositoriesAffected++;
    }
  }

  /**
   * Handle repository transferred
   */
  private async handleRepositoryTransferred(
    organization: any, 
    repoId: string, 
    repository: any, 
    result: WebhookSyncResult
  ): Promise<void> {
    const updateResult = await Organization.updateOne(
      { 
        _id: organization._id,
        'repos.repo_id': repoId 
      },
      {
        $set: {
          'repos.$.full_name': repository.full_name,
          'repos.$.last_sync': new Date(),
          updated_at: new Date()
        }
      }
    );

    if (updateResult.modifiedCount > 0) {
      result.repositoriesAffected++;
    }
  }

  /**
   * Handle repository visibility changed
   */
  private async handleRepositoryVisibilityChanged(
    organization: any, 
    repoId: string, 
    repository: any, 
    result: WebhookSyncResult
  ): Promise<void> {
    const updateResult = await Organization.updateOne(
      { 
        _id: organization._id,
        'repos.repo_id': repoId 
      },
      {
        $set: {
          'repos.$.private': repository.private,
          'repos.$.last_sync': new Date(),
          updated_at: new Date()
        }
      }
    );

    if (updateResult.modifiedCount > 0) {
      result.repositoriesAffected++;
    }
  }

  /**
   * Handle repository deleted
   */
  private async handleRepositoryDeleted(
    organization: any, 
    repoId: string, 
    result: WebhookSyncResult
  ): Promise<void> {
    await organization.removeRepository(repoId);
    result.repositoriesAffected++;
  }
}

// Singleton instance
export const webhookSyncService = new WebhookSyncService();

// Helper functions for webhook handlers
export async function handleInstallationWebhook(payload: any): Promise<WebhookSyncResult> {
  return webhookSyncService.handleInstallationEvent(payload);
}

export async function handleInstallationRepositoriesWebhook(payload: any): Promise<WebhookSyncResult> {
  return webhookSyncService.handleInstallationRepositoriesEvent(payload);
}

export async function handleRepositoryWebhook(payload: any): Promise<WebhookSyncResult> {
  return webhookSyncService.handleRepositoryEvent(payload);
}
