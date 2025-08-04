import { VCSInstallation, Repository } from '@/src/types';

/**
 * Workspace Management Utilities
 */

/**
 * Find existing workspace for the user
 * In Platyfend context, workspaces represent connected repositories
 * If no workspace exists, user needs to connect repositories first
 */
export async function findWorkspace(user: any, workspacesCollection: any): Promise<any | null> {
  // Find existing workspace where user is a member
  const userWorkspace = await workspacesCollection.findOne({
    'members.userId': user.id,
    'members.role': { $in: ['owner', 'admin', 'member'] }
  });

  return userWorkspace;
}

/**
 * Format workspace for API response
 */
export function formatWorkspace(workspace: any): any {
  return {
    id: workspace._id.toString(),
    name: workspace.name,
    slug: workspace.slug
  };
}

/**
 * Format VCS installation for API response
 */
export function formatInstallation(installation: VCSInstallation): any {
  return {
    id: installation.id,
    installationId: installation.installationId,
    provider: installation.provider,
    status: installation.status,
    accountLogin: installation.accountLogin,
    accountType: installation.accountType
  };
}

/**
 * Format repository for API response
 */
export function formatRepository(repo: any): Repository {
  return {
    id: repo._id?.toString() || repo.id,
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
  };
}

/**
 * Create error response for missing VCS accounts
 */
export function createNoVCSAccountsError(missingProviders: string[]): any {
  return {
    error: 'No VCS accounts linked',
    message: 'Connect your version control accounts to access repositories and enable automated code reviews',
    missingProviders: missingProviders,
    availableProviders: ['github', 'gitlab', 'bitbucket', 'azure'],
    requiresVCSConnection: true
  };
}

/**
 * Create error response for missing installations
 */
export function createNoInstallationsError(
  linkedProviders: string[],
  installationUrls: Record<string, string>
): any {
  return {
    error: 'No VCS integrations configured',
    message: `Please configure at least one VCS integration for: ${linkedProviders.join(', ')}`,
    linkedProviders: linkedProviders,
    installationUrls: installationUrls
  };
}
