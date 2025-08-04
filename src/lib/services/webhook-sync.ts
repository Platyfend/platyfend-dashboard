import { Organization, InstallationStatus } from '@/src/lib/database/models';
import { repositorySyncService, RepositoryMetadata } from './repository-sync';
import { errorHandlingService, createErrorContext } from './error-handling';

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
    const { action, installation } = payload;
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
          // Installation creation is handled by the callback endpoint
          console.log(`Installation ${installationId} created - handled by callback`);
          result.success = true;
          break;

        case 'deleted':
          await this.handleInstallationDeleted(installationId, result);
          break;

        case 'suspend':
          await this.handleInstallationSuspended(installationId, result);
          break;

        case 'unsuspend':
          await this.handleInstallationUnsuspended(installationId, result);
          break;

        default:
          result.errors.push(`Unhandled installation action: ${action}`);
      }

      console.log(`Installation webhook processed:`, {
        action,
        installationId,
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
   * Handle installation deleted
   */
  private async handleInstallationDeleted(installationId: string, result: WebhookSyncResult): Promise<void> {
    const updateResult = await Organization.updateMany(
      { installation_id: installationId },
      { 
        installation_status: InstallationStatus.DELETED,
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
  private async handleInstallationSuspended(installationId: string, result: WebhookSyncResult): Promise<void> {
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
  private async handleInstallationUnsuspended(installationId: string, result: WebhookSyncResult): Promise<void> {
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
    for (const repo of repositories) {
      try {
        const repoData: RepositoryMetadata = {
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
          permissions: repo.permissions
            ? Object.keys(repo.permissions).filter(p => repo.permissions[p])
            : ['read']
        };

        await organization.addRepository(repoData);
        result.repositoriesAffected++;
      } catch (error) {
        result.errors.push(`Failed to add repository ${repo.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    result.success = result.errors.length === 0;
    console.log(`Added ${result.repositoriesAffected} repositories to organization ${organization._id}`);
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
