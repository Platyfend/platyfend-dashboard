import { Organization, InstallationStatus } from '@/src/lib/database/models';
import { githubAppAuth } from '@/src/lib/github/app-auth';

export enum ErrorType {
  GITHUB_API_ERROR = 'github_api_error',
  INSTALLATION_ERROR = 'installation_error',
  WEBHOOK_ERROR = 'webhook_error',
  SYNC_ERROR = 'sync_error',
  DATABASE_ERROR = 'database_error',
  PERMISSION_ERROR = 'permission_error',
  NETWORK_ERROR = 'network_error',
}

export interface ErrorContext {
  userId?: string;
  organizationId?: string;
  installationId?: string;
  repositoryId?: string;
  operation?: string;
  timestamp: Date;
}

export interface RecoveryAction {
  type: 'retry' | 'manual_sync' | 'reinstall_app' | 'contact_support' | 'check_permissions';
  description: string;
  url?: string;
  automated?: boolean;
}

export interface PlatyfendError {
  type: ErrorType;
  message: string;
  userMessage: string;
  context: ErrorContext;
  recoveryActions: RecoveryAction[];
  retryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Error handling and recovery service
 */
export class ErrorHandlingService {

  /**
   * Handle GitHub API errors with appropriate recovery actions
   */
  handleGitHubAPIError(error: any, context: ErrorContext): PlatyfendError {
    const timestamp = new Date();
    
    // Parse GitHub API error
    if (error.response?.status === 401) {
      return {
        type: ErrorType.GITHUB_API_ERROR,
        message: 'GitHub API authentication failed',
        userMessage: 'GitHub app authentication has expired. Please reinstall the app.',
        context: { ...context, timestamp },
        recoveryActions: [
          {
            type: 'reinstall_app',
            description: 'Reinstall the GitHub app to restore access',
            automated: false
          }
        ],
        retryable: false,
        severity: 'high'
      };
    }

    if (error.response?.status === 403) {
      return {
        type: ErrorType.PERMISSION_ERROR,
        message: 'GitHub API permission denied',
        userMessage: 'The GitHub app doesn\'t have permission to access this resource.',
        context: { ...context, timestamp },
        recoveryActions: [
          {
            type: 'check_permissions',
            description: 'Check GitHub app permissions and repository access',
            url: `https://github.com/settings/installations`,
            automated: false
          }
        ],
        retryable: false,
        severity: 'medium'
      };
    }

    if (error.response?.status === 404) {
      return {
        type: ErrorType.GITHUB_API_ERROR,
        message: 'GitHub resource not found',
        userMessage: 'The requested repository or installation was not found.',
        context: { ...context, timestamp },
        recoveryActions: [
          {
            type: 'manual_sync',
            description: 'Sync repositories to update the list',
            automated: true
          }
        ],
        retryable: false,
        severity: 'low'
      };
    }

    if (error.response?.status >= 500) {
      return {
        type: ErrorType.GITHUB_API_ERROR,
        message: 'GitHub API server error',
        userMessage: 'GitHub is experiencing issues. Please try again later.',
        context: { ...context, timestamp },
        recoveryActions: [
          {
            type: 'retry',
            description: 'Retry the operation after a short delay',
            automated: true
          }
        ],
        retryable: true,
        severity: 'medium'
      };
    }

    // Rate limiting
    if (error.response?.status === 429) {
      const resetTime = error.response.headers['x-ratelimit-reset'];
      return {
        type: ErrorType.GITHUB_API_ERROR,
        message: 'GitHub API rate limit exceeded',
        userMessage: 'Too many requests to GitHub. Please wait a moment and try again.',
        context: { ...context, timestamp },
        recoveryActions: [
          {
            type: 'retry',
            description: `Retry after rate limit resets${resetTime ? ` at ${new Date(resetTime * 1000).toLocaleTimeString()}` : ''}`,
            automated: true
          }
        ],
        retryable: true,
        severity: 'low'
      };
    }

    // Generic GitHub API error
    return {
      type: ErrorType.GITHUB_API_ERROR,
      message: `GitHub API error: ${error.message}`,
      userMessage: 'Unable to connect to GitHub. Please check your connection and try again.',
      context: { ...context, timestamp },
      recoveryActions: [
        {
          type: 'retry',
          description: 'Retry the operation',
          automated: true
        }
      ],
      retryable: true,
      severity: 'medium'
    };
  }

  /**
   * Handle installation errors
   */
  handleInstallationError(error: any, context: ErrorContext): PlatyfendError {
    const timestamp = new Date();

    if (error.message?.includes('installation not found')) {
      return {
        type: ErrorType.INSTALLATION_ERROR,
        message: 'GitHub app installation not found',
        userMessage: 'The GitHub app is not installed or has been removed.',
        context: { ...context, timestamp },
        recoveryActions: [
          {
            type: 'reinstall_app',
            description: 'Install the GitHub app to access repositories',
            automated: false
          }
        ],
        retryable: false,
        severity: 'high'
      };
    }

    if (error.message?.includes('suspended')) {
      return {
        type: ErrorType.INSTALLATION_ERROR,
        message: 'GitHub app installation suspended',
        userMessage: 'The GitHub app installation has been suspended.',
        context: { ...context, timestamp },
        recoveryActions: [
          {
            type: 'check_permissions',
            description: 'Check GitHub app status and reactivate if needed',
            url: 'https://github.com/settings/installations',
            automated: false
          }
        ],
        retryable: false,
        severity: 'high'
      };
    }

    return {
      type: ErrorType.INSTALLATION_ERROR,
      message: `Installation error: ${error.message}`,
      userMessage: 'There was a problem with the GitHub app installation.',
      context: { ...context, timestamp },
      recoveryActions: [
        {
          type: 'reinstall_app',
          description: 'Reinstall the GitHub app',
          automated: false
        }
      ],
      retryable: false,
      severity: 'medium'
    };
  }

  /**
   * Handle webhook processing errors
   */
  handleWebhookError(error: any, context: ErrorContext): PlatyfendError {
    const timestamp = new Date();

    return {
      type: ErrorType.WEBHOOK_ERROR,
      message: `Webhook processing error: ${error.message}`,
      userMessage: 'Failed to process GitHub webhook. Repository data may be temporarily out of sync.',
      context: { ...context, timestamp },
      recoveryActions: [
        {
          type: 'manual_sync',
          description: 'Manually sync repositories to ensure data consistency',
          automated: true
        }
      ],
      retryable: true,
      severity: 'low'
    };
  }

  /**
   * Handle sync errors
   */
  handleSyncError(error: any, context: ErrorContext): PlatyfendError {
    const timestamp = new Date();

    return {
      type: ErrorType.SYNC_ERROR,
      message: `Sync error: ${error.message}`,
      userMessage: 'Failed to synchronize repository data. Please try again.',
      context: { ...context, timestamp },
      recoveryActions: [
        {
          type: 'manual_sync',
          description: 'Manually sync repositories',
          automated: true
        }
      ],
      retryable: true,
      severity: 'medium'
    };
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(error: any, context: ErrorContext): PlatyfendError {
    const timestamp = new Date();

    if (error.name === 'ValidationError') {
      return {
        type: ErrorType.DATABASE_ERROR,
        message: `Database validation error: ${error.message}`,
        userMessage: 'Invalid data detected. Please try again.',
        context: { ...context, timestamp },
        recoveryActions: [
          {
            type: 'retry',
            description: 'Retry with corrected data',
            automated: false
          }
        ],
        retryable: false,
        severity: 'medium'
      };
    }

    if (error.name === 'MongoNetworkError') {
      return {
        type: ErrorType.DATABASE_ERROR,
        message: 'Database connection error',
        userMessage: 'Unable to connect to the database. Please try again later.',
        context: { ...context, timestamp },
        recoveryActions: [
          {
            type: 'retry',
            description: 'Retry the operation',
            automated: true
          }
        ],
        retryable: true,
        severity: 'high'
      };
    }

    return {
      type: ErrorType.DATABASE_ERROR,
      message: `Database error: ${error.message}`,
      userMessage: 'A database error occurred. Please try again.',
      context: { ...context, timestamp },
      recoveryActions: [
        {
          type: 'retry',
          description: 'Retry the operation',
          automated: true
        }
      ],
      retryable: true,
      severity: 'medium'
    };
  }

  /**
   * Attempt automatic recovery for retryable errors
   */
  async attemptRecovery(error: PlatyfendError, maxRetries: number = 3): Promise<boolean> {
    if (!error.retryable) {
      return false;
    }

    const retryAction = error.recoveryActions.find(action => action.type === 'retry' && action.automated);
    if (!retryAction) {
      return false;
    }

    // Implement exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Max 30 seconds
      
      console.log(`Recovery attempt ${attempt}/${maxRetries} for ${error.type} after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        // The actual retry logic would be implemented by the calling service
        // This is just the framework for retry timing
        return true;
      } catch (retryError) {
        console.error(`Recovery attempt ${attempt} failed:`, retryError);
        
        if (attempt === maxRetries) {
          console.error(`All recovery attempts failed for ${error.type}`);
          return false;
        }
      }
    }

    return false;
  }

  /**
   * Log error for monitoring and debugging
   */
  logError(error: PlatyfendError): void {
    const logData = {
      type: error.type,
      message: error.message,
      severity: error.severity,
      context: error.context,
      retryable: error.retryable,
      timestamp: new Date().toISOString()
    };

    // Log to console (in production, this would go to a proper logging service)
    if (error.severity === 'critical' || error.severity === 'high') {
      console.error('Platyfend Error:', logData);
    } else {
      console.warn('Platyfend Warning:', logData);
    }

    // In production, send to monitoring service (e.g., Sentry, DataDog)
    // await this.sendToMonitoring(logData);
  }
}

// Singleton instance
export const errorHandlingService = new ErrorHandlingService();

// Helper functions
export function createErrorContext(
  userId?: string,
  organizationId?: string,
  installationId?: string,
  repositoryId?: string,
  operation?: string
): ErrorContext {
  return {
    userId,
    organizationId,
    installationId,
    repositoryId,
    operation,
    timestamp: new Date()
  };
}

export function isRetryableError(error: any): boolean {
  if (error.response?.status >= 500) return true;
  if (error.response?.status === 429) return true;
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
  return false;
}
