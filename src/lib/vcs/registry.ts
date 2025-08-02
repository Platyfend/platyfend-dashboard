import { VCSProvider, VCSProviderRegistry } from './types';
import { VCSProviderType } from '@/src/types';
import { GitHubProvider } from './providers/github';
import { GitLabProvider } from './providers/gitlab';
import { BitbucketProvider } from './providers/bitbucket';
import { AzureProvider } from './providers/azure';

/**
 * VCS Provider Registry Implementation
 * Manages all available VCS providers and provides access to them
 */
export class DefaultVCSProviderRegistry implements VCSProviderRegistry {
  private providers: Map<VCSProviderType, VCSProvider>;

  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  /**
   * Initialize all available VCS providers
   */
  private initializeProviders(): void {
    // Register GitHub provider (fully implemented)
    this.providers.set('github', new GitHubProvider());
    
    // Register other providers (placeholder implementations)
    this.providers.set('gitlab', new GitLabProvider());
    this.providers.set('bitbucket', new BitbucketProvider());
    this.providers.set('azure', new AzureProvider());
  }

  /**
   * Get a specific VCS provider by name
   */
  getProvider(name: VCSProviderType): VCSProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all registered VCS providers
   */
  getAllProviders(): VCSProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get list of available provider names
   */
  getAvailableProviders(): VCSProviderType[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is registered
   */
  hasProvider(name: VCSProviderType): boolean {
    return this.providers.has(name);
  }

  /**
   * Register a new provider (for extensibility)
   */
  registerProvider(provider: VCSProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Unregister a provider
   */
  unregisterProvider(name: VCSProviderType): boolean {
    return this.providers.delete(name);
  }
}

// Singleton instance for global use
export const vcsProviderRegistry = new DefaultVCSProviderRegistry();
