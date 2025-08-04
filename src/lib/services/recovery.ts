import { Organization, InstallationStatus } from '@/src/lib/database/models';
import { githubAppAuth } from '@/src/lib/github/app-auth';
import { repositorySyncService } from './repository-sync';
import { errorHandlingService, createErrorContext } from './error-handling';

export interface RecoveryResult {
  success: boolean;
  action: string;
  message: string;
  details?: any;
  requiresUserAction?: boolean;
  userActionUrl?: string;
}

/**
 * Recovery service for handling system failures and data inconsistencies
 */
export class RecoveryService {

  /**
   * Attempt to recover from webhook delivery failures
   */
  async recoverFromWebhookFailure(
    installationId: string,
    lastSuccessfulWebhook?: Date
  ): Promise<RecoveryResult> {
    try {
      // Find organizations affected by this installation
      const organizations = await Organization.find({
        installation_id: installationId
      });

      if (organizations.length === 0) {
        return {
          success: false,
          action: 'webhook_recovery',
          message: 'No organizations found for installation',
          requiresUserAction: true,
          userActionUrl: '/dashboard'
        };
      }

      let recoveredCount = 0;
      const errors: string[] = [];

      // Sync each organization to recover from missed webhooks
      for (const org of organizations) {
        try {
          const syncResult = await repositorySyncService.syncOrganizationRepositories(
            org._id.toString()
          );
          
          if (syncResult.success) {
            recoveredCount++;
          } else {
            errors.push(`Org ${org.org_name}: ${syncResult.errors.map(e => e.error).join(', ')}`);
          }
        } catch (error) {
          errors.push(`Org ${org.org_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: recoveredCount > 0,
        action: 'webhook_recovery',
        message: `Recovered ${recoveredCount}/${organizations.length} organizations`,
        details: {
          recovered: recoveredCount,
          total: organizations.length,
          errors: errors.length > 0 ? errors : undefined
        },
        requiresUserAction: recoveredCount === 0
      };

    } catch (error) {
      const context = createErrorContext(undefined, undefined, installationId, undefined, 'webhook_recovery');
      const platyfendError = errorHandlingService.handleDatabaseError(error, context);
      errorHandlingService.logError(platyfendError);

      return {
        success: false,
        action: 'webhook_recovery',
        message: platyfendError.userMessage,
        requiresUserAction: true
      };
    }
  }

  /**
   * Recover from installation access revocation
   */
  async recoverFromAccessRevocation(installationId: string): Promise<RecoveryResult> {
    try {
      // Check if installation still exists on GitHub
      let installationExists = false;
      try {
        await githubAppAuth.getInstallation(installationId);
        installationExists = true;
      } catch (error) {
        // Installation doesn't exist or we don't have access
        installationExists = false;
      }

      if (!installationExists) {
        // Mark installation as deleted
        await Organization.updateMany(
          { installation_id: installationId },
          { 
            installation_status: InstallationStatus.DELETED,
            updated_at: new Date()
          }
        );

        return {
          success: true,
          action: 'access_revocation_recovery',
          message: 'Installation marked as deleted. Please reinstall the GitHub app.',
          requiresUserAction: true,
          userActionUrl: '/dashboard'
        };
      }

      // Installation exists but we might not have proper access
      // Try to get installation repositories to test access
      try {
        await githubAppAuth.getInstallationRepositories(installationId);
        
        // Access is working, mark as active
        await Organization.updateMany(
          { installation_id: installationId },
          { 
            installation_status: InstallationStatus.ACTIVE,
            updated_at: new Date()
          }
        );

        return {
          success: true,
          action: 'access_revocation_recovery',
          message: 'Installation access restored successfully.',
          requiresUserAction: false
        };

      } catch (error) {
        // Access is still restricted, mark as suspended
        await Organization.updateMany(
          { installation_id: installationId },
          { 
            installation_status: InstallationStatus.SUSPENDED,
            updated_at: new Date()
          }
        );

        return {
          success: false,
          action: 'access_revocation_recovery',
          message: 'Installation access is restricted. Please check GitHub app permissions.',
          requiresUserAction: true,
          userActionUrl: 'https://github.com/settings/installations'
        };
      }

    } catch (error) {
      const context = createErrorContext(undefined, undefined, installationId, undefined, 'access_recovery');
      const platyfendError = errorHandlingService.handleInstallationError(error, context);
      errorHandlingService.logError(platyfendError);

      return {
        success: false,
        action: 'access_revocation_recovery',
        message: platyfendError.userMessage,
        requiresUserAction: true
      };
    }
  }

  /**
   * Resolve data consistency issues between GitHub and MongoDB
   */
  async resolveDataInconsistency(organizationId: string): Promise<RecoveryResult> {
    try {
      const organization = await Organization.findOne({ org_id: organizationId });

      if (!organization) {
        return {
          success: false,
          action: 'data_consistency_recovery',
          message: 'Organization not found',
          requiresUserAction: true
        };
      }

      if (organization.installation_status !== InstallationStatus.ACTIVE) {
        return {
          success: false,
          action: 'data_consistency_recovery',
          message: 'Cannot sync inactive installation',
          requiresUserAction: true,
          userActionUrl: '/dashboard'
        };
      }

      // Perform full sync to resolve inconsistencies
      const syncResult = await repositorySyncService.syncOrganizationRepositories(organizationId);

      if (syncResult.success) {
        return {
          success: true,
          action: 'data_consistency_recovery',
          message: 'Data consistency restored successfully',
          details: syncResult.summary
        };
      } else {
        return {
          success: false,
          action: 'data_consistency_recovery',
          message: 'Failed to resolve data inconsistency',
          details: {
            summary: syncResult.summary,
            errors: syncResult.errors
          },
          requiresUserAction: true
        };
      }

    } catch (error) {
      const context = createErrorContext(undefined, organizationId, undefined, undefined, 'consistency_recovery');
      const platyfendError = errorHandlingService.handleSyncError(error, context);
      errorHandlingService.logError(platyfendError);

      return {
        success: false,
        action: 'data_consistency_recovery',
        message: platyfendError.userMessage,
        requiresUserAction: true
      };
    }
  }

  /**
   * Recover from GitHub API rate limiting
   */
  async recoverFromRateLimit(installationId: string): Promise<RecoveryResult> {
    try {
      // Check rate limit status
      const { headers } = githubAppAuth.createJWTAPIClient();
      const response = await fetch('https://api.github.com/rate_limit', { headers });
      
      if (!response.ok) {
        throw new Error('Failed to check rate limit status');
      }

      const rateLimitData = await response.json();
      const resetTime = new Date(rateLimitData.rate.reset * 1000);
      const now = new Date();
      const waitTime = Math.max(0, resetTime.getTime() - now.getTime());

      if (waitTime > 0) {
        return {
          success: false,
          action: 'rate_limit_recovery',
          message: `Rate limit active. Resets at ${resetTime.toLocaleTimeString()}`,
          details: {
            resetTime: resetTime.toISOString(),
            waitTimeMs: waitTime,
            remaining: rateLimitData.rate.remaining,
            limit: rateLimitData.rate.limit
          },
          requiresUserAction: false
        };
      }

      // Rate limit has reset, we can proceed
      return {
        success: true,
        action: 'rate_limit_recovery',
        message: 'Rate limit has reset, operations can resume',
        details: {
          remaining: rateLimitData.rate.remaining,
          limit: rateLimitData.rate.limit
        },
        requiresUserAction: false
      };

    } catch (error) {
      return {
        success: false,
        action: 'rate_limit_recovery',
        message: 'Unable to check rate limit status',
        requiresUserAction: false
      };
    }
  }

  /**
   * Perform health check on organization installations
   */
  async performHealthCheck(userId: string): Promise<RecoveryResult> {
    try {
      const organizations = await Organization.find({ user_id: userId });
      
      if (organizations.length === 0) {
        return {
          success: true,
          action: 'health_check',
          message: 'No organizations to check',
          details: { organizationCount: 0 }
        };
      }

      const results = {
        total: organizations.length,
        healthy: 0,
        unhealthy: 0,
        issues: [] as string[]
      };

      for (const org of organizations) {
        try {
          if (org.installation_status === InstallationStatus.ACTIVE) {
            // Test GitHub API access
            await githubAppAuth.getInstallationRepositories(org.installation_id);
            results.healthy++;
          } else {
            results.issues.push(`${org.org_name}: Installation ${org.installation_status}`);
            results.unhealthy++;
          }
        } catch (error) {
          results.issues.push(`${org.org_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          results.unhealthy++;
        }
      }

      return {
        success: results.unhealthy === 0,
        action: 'health_check',
        message: `Health check complete: ${results.healthy}/${results.total} organizations healthy`,
        details: results,
        requiresUserAction: results.unhealthy > 0
      };

    } catch (error) {
      const context = createErrorContext(userId, undefined, undefined, undefined, 'health_check');
      const platyfendError = errorHandlingService.handleDatabaseError(error, context);
      errorHandlingService.logError(platyfendError);

      return {
        success: false,
        action: 'health_check',
        message: platyfendError.userMessage,
        requiresUserAction: true
      };
    }
  }
}

// Singleton instance
export const recoveryService = new RecoveryService();

// Helper functions
export async function recoverFromWebhookFailure(installationId: string, lastSuccessfulWebhook?: Date) {
  return recoveryService.recoverFromWebhookFailure(installationId, lastSuccessfulWebhook);
}

export async function recoverFromAccessRevocation(installationId: string) {
  return recoveryService.recoverFromAccessRevocation(installationId);
}

export async function resolveDataInconsistency(organizationId: string) {
  return recoveryService.resolveDataInconsistency(organizationId);
}

export async function performHealthCheck(userId: string) {
  return recoveryService.performHealthCheck(userId);
}
