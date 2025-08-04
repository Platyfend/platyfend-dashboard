import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useErrorHandler } from "@/src/components/ui/error-boundary";

export interface OrganizationRepository {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  private: boolean;
  language?: string;
  stars: number;
  forks: number;
  url?: string;
  defaultBranch?: string;
  lastSync: string;
  addedAt: string;
}

export interface OrganizationInfo {
  id: string;
  name: string;
  type: string;
  installationStatus: string;
  totalRepos: number;
  publicRepos: number;
  privateRepos: number;
  lastUpdated: string;
}

export interface OrganizationReposResponse {
  organization: OrganizationInfo;
  repositories: OrganizationRepository[];
  syncInfo: {
    canSync: boolean;
    lastSync: string;
    repositoryCount: number;
  };
}

export interface OrganizationReposError {
  message: string;
  requiresInstallation?: boolean;
  installationStatus?: string;
}

/**
 * Hook to fetch repositories for a specific organization from MongoDB
 */
export function useOrganizationRepos(organizationId: string | null) {
  const { data: session } = useSession();

  return useQuery<OrganizationReposResponse, OrganizationReposError>({
    queryKey: ['organization-repos', organizationId],
    queryFn: async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const response = await fetch(`/api/organizations/${organizationId}/repositories`);
      const data = await response.json();

      if (!response.ok) {
        const error: OrganizationReposError = {
          message: data.message || `Failed to fetch repositories: ${response.statusText}`,
          requiresInstallation: response.status === 404 || data.installationStatus !== 'active',
          installationStatus: data.installationStatus,
        };
        throw error;
      }

      return data;
    },
    enabled: !!organizationId && !!session?.user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      if (error?.requiresInstallation) {
        return false; // Don't retry if installation is required
      }
      // Retry on network errors and server errors
      if (error?.message?.includes('network') || error?.message?.includes('500')) {
        return failureCount < 3;
      }
      // Don't retry on client errors (4xx)
      if (error?.message?.includes('404') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2; // Limited retries for other errors
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

/**
 * Hook to sync repositories for an organization
 */
export function useOrganizationRepoSync(organizationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }

      const response = await fetch(`/api/organizations/${organizationId}/repositories/sync`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to sync repositories');
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch organization repos
      queryClient.invalidateQueries({
        queryKey: ['organization-repos', organizationId]
      });
      
      // Also invalidate organizations list to update repo counts
      queryClient.invalidateQueries({
        queryKey: ['organizations']
      });
    },
  });
}

/**
 * Hook to get current user's organizations from session
 */
export function useUserOrganizations() {
  const { data: session } = useSession();

  return {
    organizations: session?.organizations || [],
    currentOrganization: session?.currentOrganization,
    isLoading: !session, // Simple loading state based on session
  };
}

/**
 * Hook to get repositories for the current organization
 */
export function useCurrentOrganizationRepos() {
  const { currentOrganization } = useUserOrganizations();
  
  return useOrganizationRepos(currentOrganization?.id || null);
}

/**
 * Hook to get organization by ID from session
 */
export function useOrganizationById(organizationId: string | null) {
  const { organizations } = useUserOrganizations();
  
  const organization = organizations.find(org => org.id === organizationId);
  
  return {
    organization,
    isFound: !!organization,
  };
}

/**
 * Hook to get repository statistics across all organizations
 */
export function useRepositoryStats() {
  const { organizations } = useUserOrganizations();

  const stats = organizations.reduce(
    (acc, org) => ({
      totalRepos: acc.totalRepos + org.repoCount,
      activeInstallations: acc.activeInstallations + (org.installationStatus === 'active' ? 1 : 0),
      pendingInstallations: acc.pendingInstallations + (org.installationStatus === 'pending' ? 1 : 0),
      organizations: acc.organizations + 1,
    }),
    {
      totalRepos: 0,
      activeInstallations: 0,
      pendingInstallations: 0,
      organizations: 0,
    }
  );

  return stats;
}

/**
 * Helper function to check if an organization needs GitHub app installation
 */
export function organizationNeedsInstallation(installationStatus?: string): boolean {
  return !installationStatus || 
         installationStatus === 'pending' || 
         installationStatus === 'deleted' || 
         installationStatus === 'suspended';
}

/**
 * Helper function to get installation status display text
 */
export function getInstallationStatusText(status?: string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'pending':
      return 'Installation Pending';
    case 'suspended':
      return 'Suspended';
    case 'deleted':
      return 'Not Installed';
    default:
      return 'Unknown';
  }
}

/**
 * Helper function to get installation status color
 */
export function getInstallationStatusColor(status?: string): string {
  switch (status) {
    case 'active':
      return 'text-green-600';
    case 'pending':
      return 'text-yellow-600';
    case 'suspended':
      return 'text-red-600';
    case 'deleted':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
}
