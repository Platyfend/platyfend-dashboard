import { useQuery } from "@tanstack/react-query";
import { MultiVCSRepositoriesResponse, VCSProviderType } from "@/src/types";

export interface RepositoriesError {
  message: string;
  // Legacy GitHub-specific fields (for backward compatibility)
  requiresGitHubAuth?: boolean;
  requiresGitHubAppInstall?: boolean;
  installUrl?: string;
  workspaceId?: string;
  // New multi-VCS fields
  missingProviders?: VCSProviderType[];
  availableProviders?: VCSProviderType[];
  linkedProviders?: VCSProviderType[];
  installationUrls?: Record<VCSProviderType, string>;
  requiresVCSConnection?: boolean;
  // Workspace setup
  requiresWorkspaceSetup?: boolean;
}

export function useRepositories() {
    return useQuery<MultiVCSRepositoriesResponse, RepositoriesError>({
        queryKey: ['repositories'],
        queryFn: async () => {
            const response = await fetch("/api/repositories")
            const data = await response.json()

            if (!response.ok) {
                // Handle specific error cases
                const error: RepositoriesError = {
                    message: data.message || `Failed to fetch repositories: ${response.statusText}`,
                    missingProviders: data.missingProviders,
                    availableProviders: data.availableProviders,
                    linkedProviders: data.linkedProviders,
                    installationUrls: data.installationUrls,
                    requiresVCSConnection: data.requiresVCSConnection,
                    requiresWorkspaceSetup: data.requiresWorkspaceSetup
                }
                throw error
            }

            return data
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error) => {
            // Don't retry if it's an auth, installation, or workspace setup issue
            if (error?.requiresGitHubAuth || error?.requiresGitHubAppInstall ||
                error?.missingProviders?.length || error?.installationUrls ||
                error?.requiresVCSConnection || error?.requiresWorkspaceSetup) {
                return false
            }
            return failureCount < 2
        },
        refetchOnWindowFocus: true
    })
}