import { VCSProviderType, VCSInstallation, Repository } from '@/src/types';

/**
 * VCS Provider Interface
 * Defines the contract that all VCS providers must implement
 */
export interface VCSProvider {
  readonly name: VCSProviderType;
  
  /**
   * Step 2: VCS Provider Detection
   * Check if user has linked account for this provider
   */
  checkLinkedAccount(userId: string, accountsCollection: any): Promise<any | null>;
  
  /**
   * Step 4: Multi-Provider Installation Check
   * Check if provider app/integration is installed for workspace
   */
  checkInstallation(workspace: any, installationsCollection: any): Promise<VCSInstallation | null>;
  
  /**
   * Step 5: Provider-Specific Repository Fetching
   * Fetch repositories for this provider's installation
   */
  fetchRepositories(
    installation: VCSInstallation, 
    repositoriesCollection: any, 
    workspaceId: string
  ): Promise<Repository[]>;
  
  /**
   * Helper: Get installation URL for this provider
   */
  getInstallationUrl(workspaceId: string): string;
  
  /**
   * Helper: Get provider-specific error responses
   */
  getProviderSpecificErrorResponse(errorType: 'no_account' | 'no_installation', workspaceId: string): any;
}

/**
 * VCS Provider Registry
 * Manages all available VCS providers
 */
export interface VCSProviderRegistry {
  getProvider(name: VCSProviderType): VCSProvider | undefined;
  getAllProviders(): VCSProvider[];
  getAvailableProviders(): VCSProviderType[];
}

/**
 * Linked Provider Information
 */
export interface LinkedProvider {
  provider: VCSProviderType;
  account: any;
}

/**
 * Active Installation Information
 */
export interface ActiveInstallation {
  provider: VCSProviderType;
  installation: VCSInstallation;
}

/**
 * VCS Detection Result
 */
export interface VCSDetectionResult {
  linkedProviders: LinkedProvider[];
  missingProviders: VCSProviderType[];
}

/**
 * Installation Check Result
 */
export interface InstallationCheckResult {
  activeInstallations: ActiveInstallation[];
  installationUrls: Record<VCSProviderType, string>;
}
