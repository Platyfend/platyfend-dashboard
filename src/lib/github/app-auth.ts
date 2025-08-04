import jwt from 'jsonwebtoken';
import { env } from '@/src/lib/config/environment';

// Cache for installation tokens to minimize API calls
interface InstallationTokenCache {
  token: string;
  expiresAt: number;
}

const installationTokenCache = new Map<string, InstallationTokenCache>();

/**
 * GitHub App Authentication Service
 * Handles JWT generation and installation token management
 */
export class GitHubAppAuth {
  private readonly appId: string;
  private readonly privateKey: string;

  constructor() {
    this.appId = env.GITHUB_APP_ID;
    this.privateKey = env.GITHUB_PRIVATE_KEY;
  }

  /**
   * Generate JWT token for GitHub App authentication
   * Valid for 10 minutes as per GitHub's requirements
   */
  generateJWT(): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60, // Issued 1 minute ago to account for clock skew
      exp: now + (10 * 60), // Expires in 10 minutes
      iss: this.appId, // GitHub App ID
    };

    try {
      return jwt.sign(payload, this.privateKey, { algorithm: 'RS256' });
    } catch (error) {
      throw new Error(`Failed to generate JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get installation access token with caching
   * Tokens are valid for 1 hour, we cache them for 50 minutes to be safe
   */
  async getInstallationToken(installationId: string): Promise<string> {
    const cacheKey = `installation_${installationId}`;
    const cached = installationTokenCache.get(cacheKey);

    // Return cached token if still valid (with 10-minute buffer)
    if (cached && cached.expiresAt > Date.now() + (10 * 60 * 1000)) {
      return cached.token;
    }

    try {
      const jwt = this.generateJWT();
      const response = await fetch(
        `https://api.github.com/app/installations/${installationId}/access_tokens`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Platyfend-GitHub-App',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}. ${
            errorData.message || 'Unknown error'
          }`
        );
      }

      const data = await response.json();
      const token = data.token;
      const expiresAt = new Date(data.expires_at).getTime();

      // Cache the token (expires in 1 hour, we cache for 50 minutes)
      installationTokenCache.set(cacheKey, {
        token,
        expiresAt: expiresAt - (10 * 60 * 1000), // 10 minutes before actual expiry
      });

      return token;
    } catch (error) {
      // Clear any cached token on error
      installationTokenCache.delete(cacheKey);
      throw new Error(
        `Failed to get installation token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create authenticated API client for GitHub App
   */
  async createAPIClient(installationId: string) {
    const token = await this.getInstallationToken(installationId);
    
    return {
      token,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Platyfend-GitHub-App',
      },
    };
  }

  /**
   * Create authenticated API client using JWT (for app-level operations)
   */
  createJWTAPIClient() {
    const jwt = this.generateJWT();
    
    return {
      token: jwt,
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Platyfend-GitHub-App',
      },
    };
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!signature || !env.GITHUB_WEBHOOK_SECRET) {
      return false;
    }

    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', env.GITHUB_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    const receivedSignature = signature.replace('sha256=', '');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Get GitHub App installation URL
   */
  getInstallationURL(state?: string): string {
    const baseUrl = `https://github.com/apps/${env.GITHUB_APP_NAME}/installations/new`;
    return state ? `${baseUrl}?state=${encodeURIComponent(state)}` : baseUrl;
  }

  /**
   * Clear cached token for installation (useful for error recovery)
   */
  clearInstallationTokenCache(installationId: string): void {
    const cacheKey = `installation_${installationId}`;
    installationTokenCache.delete(cacheKey);
  }

  /**
   * Get installation details using JWT
   */
  async getInstallation(installationId: string) {
    try {
      const { headers } = this.createJWTAPIClient();
      const response = await fetch(
        `https://api.github.com/app/installations/${installationId}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to get installation: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to get installation details: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * List repositories accessible to the installation
   */
  async getInstallationRepositories(installationId: string) {
    try {
      const { headers } = await this.createAPIClient(installationId);
      const response = await fetch(
        `https://api.github.com/installation/repositories?per_page=100`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to get repositories: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.repositories || [];
    } catch (error) {
      throw new Error(
        `Failed to get installation repositories: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// Singleton instance
export const githubAppAuth = new GitHubAppAuth();

// Helper functions for common operations
export async function getInstallationToken(installationId: string): Promise<string> {
  return githubAppAuth.getInstallationToken(installationId);
}

export function verifyGitHubWebhook(payload: string, signature: string): boolean {
  return githubAppAuth.verifyWebhookSignature(payload, signature);
}

export function getGitHubAppInstallURL(state?: string): string {
  return githubAppAuth.getInstallationURL(state);
}
